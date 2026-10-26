import { createTextStreamResponse, Output, streamText, toTextStream } from 'ai'

import { clientIp, rateLimit } from '@/lib/rate-limit'
import { STUDIO_AI_ENABLED } from '@/lib/studio/flags'
import { guideDraftSchema, writeRequestSchema } from '@/lib/studio/schema'

// Writing a whole guide takes a while; allow up to two minutes
export const maxDuration = 120

// Each request writes a whole guide, so one maker gets 10 a minute
const LIMIT = 10
const WINDOW_MS = 60_000

const MODEL = 'anthropic/claude-sonnet-5'

const SYSTEM = `You write step-by-step sewing guides for Sigrid, an app where pattern makers sell patterns and first-time sewers follow them.

A pattern maker gives you their notes, or asks for a change to the guide they already have. You return the whole guide: pattern pieces and every step.

How a guide is built
- Steps are grouped in sections (the "group" field): consecutive steps share a section. Typical sections: "Prepare", "Cut the pieces" or one per piece ("Cut the front"), one per construction stage ("Sew the straps", "Sew the side seams"), and "Finish". Aim for 2 to 6 steps per section.
- One action per step. Pick the action: prepare, cut, mark, fold, pin, sew, press or attach.
- Link a step to the piece it works on with pieceId (and secondPieceId when two pieces are joined). Use the ids of the pieces you return.
- annotation draws on that piece: cut-line, fold-line, sew-line (with amount = distance from the edge in cm), pin-row or measure-arrow, on an edge: top, bottom, left or right.
- tool is the main tool: scissors, pins, needle (the sewing machine), iron, chalk or ruler.
- Pieces are simple outlines in cm for size M. Use trapezoid when top and bottom widths differ.

Voice (this matters)
- Sigrid sounds like a calm, experienced friend at the sewing table. Every sentence should leave a nervous first-time sewer calmer and clearer.
- Calm, not cheerful: no exclamation marks, no hype, no emoji.
- Short sentences, one action each. Numbers with units: "Sew 1.5 cm from the edge".
- Explain sewing terms the first time they appear (right side, selvedge, topstitch) in a few words.
- Body-neutral: sizes and measurements, never "flattering".

Honesty
- Keep the maker's construction order and numbers. Never invent measurements silently.
- When you had to guess (a missing seam allowance, an unclear order, a step you added), still write the step, and say what to check in its "review" field. Leave "review" out for steps taken straight from the notes.
- When changing an existing guide, change only what was asked and keep every other step as it was, word for word, including its review field.
- The reply tells the maker in one to three sentences what you wrote or changed and what to look at.`

export async function POST(request: Request) {
  if (!STUDIO_AI_ENABLED) {
    return Response.json({ error: 'The assistant is switched off for now.' }, { status: 503 })
  }

  const limited = rateLimit(`studio:${clientIp(request.headers)}`, LIMIT, WINDOW_MS)
  if (!limited.ok) {
    return Response.json(
      { error: 'Too many requests. Try again in a minute.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } },
    )
  }

  if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
    return Response.json(
      { error: 'The assistant is not connected yet. Add AI Gateway credentials to .env.local (run `vercel env pull`).' },
      { status: 503 },
    )
  }

  const parsed = writeRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'That request could not be read.' }, { status: 400 })
  }
  const { message, pattern } = parsed.data

  const hasGuide = pattern.steps.length > 0
  const prompt = hasGuide
    ? `The current guide for "${pattern.name}" (${pattern.difficulty}, ${pattern.category}):\n${JSON.stringify({ pieces: pattern.pieces, steps: pattern.steps })}\n\nThe pattern maker asks:\n${message}`
    : `Pattern: "${pattern.name}" (${pattern.difficulty}, ${pattern.category}).\n\nThe pattern maker's notes:\n${message}`

  const result = streamText({
    model: MODEL,
    system: SYSTEM,
    prompt,
    output: Output.object({ schema: guideDraftSchema }),
    onError({ error }) {
      console.error('[studio/write]', error)
    },
  })

  // Wait for the first words before answering, so a refused request (billing, limits,
  // a model outage) reaches the editor as an error instead of an empty stream
  const [peek, rest] = result.stream.tee()
  const reader = peek.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done || value.type === 'text-delta') break
    if (value.type === 'error') {
      reader.cancel()
      rest.cancel()
      return Response.json({ error: friendlyError(value.error) }, { status: 502 })
    }
  }
  reader.cancel()

  return createTextStreamResponse({ stream: toTextStream({ stream: rest }) })
}

function friendlyError(error: unknown): string {
  const text = error instanceof Error ? `${error.message} ${String((error as { responseBody?: string }).responseBody ?? '')}` : String(error)
  if (/credit card|customer_verification/i.test(text)) {
    return 'The AI service needs a payment card on the Vercel account before it can write. Add one under AI Gateway in the Vercel dashboard, then try again.'
  }
  if (/rate|quota|429/i.test(text)) return 'The AI service is busy or over its limit. Try again in a minute.'
  return 'The AI service did not answer. Try again in a moment.'
}
