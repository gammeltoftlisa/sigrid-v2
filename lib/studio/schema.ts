import { z } from 'zod'

/**
 * What the studio assistant writes: a short reply to the pattern maker, then the
 * pattern pieces, then the steps. Shared by the API route (to constrain the model)
 * and the editor (to read the stream as it arrives). The order matters: the reply
 * streams first, so the maker sees what is happening before the steps fill in.
 */

export const STEP_ACTIONS = ['prepare', 'cut', 'mark', 'fold', 'pin', 'sew', 'press', 'attach'] as const
export const STEP_TOOLS = ['scissors', 'pins', 'needle', 'iron', 'chalk', 'ruler'] as const
export const ANNOTATION_TYPES = ['cut-line', 'fold-line', 'sew-line', 'pin-row', 'measure-arrow'] as const
export const PIECE_EDGES = ['top', 'bottom', 'left', 'right'] as const

export const pieceSchema = z.object({
  id: z.string().describe('Short kebab-case id, e.g. "front-panel". Steps refer to it.'),
  label: z.string().describe('One capital letter printed on the pattern piece: A, B, C…'),
  name: z.string().describe('Plain name, e.g. "Front panel"'),
  shape: z.enum(['rectangle', 'trapezoid']).describe('Closest simple outline. Trapezoid when top and bottom widths differ.'),
  topWidth: z.number().describe('Width at the top edge in cm, for size M, seam allowance included'),
  bottomWidth: z.number().describe('Width at the bottom edge in cm, for size M'),
  height: z.number().describe('Height in cm, for size M'),
  quantity: z.number().describe('How many to cut'),
  grainLine: z.enum(['vertical', 'horizontal']),
  seamAllowance: z.number().describe('Seam allowance in cm'),
})

export const stepSchema = z.object({
  group: z
    .string()
    .describe('Section this step belongs to, e.g. "Prepare", "Cut the front", "Sew the side seams", "Finish". Consecutive steps share a section; aim for 2–6 steps per section.'),
  action: z.enum(STEP_ACTIONS),
  title: z.string().describe('A short imperative, 2–6 words, e.g. "Pin the side seams"'),
  instruction: z
    .string()
    .describe('One to three calm, short sentences a first-time sewer can follow. Numbers with units ("Sew 1.5 cm from the edge").'),
  pieceId: z.string().optional().describe('The piece this step works on, if any'),
  secondPieceId: z.string().optional().describe('A second piece joined in this step'),
  fabricSide: z.enum(['right', 'wrong']).optional().describe('Which side of the fabric faces up'),
  annotation: z
    .object({
      type: z.enum(ANNOTATION_TYPES),
      edge: z.enum(PIECE_EDGES).optional(),
      amount: z.number().optional().describe('Distance from the edge in cm, e.g. the seam allowance'),
      label: z.string().optional(),
    })
    .optional()
    .describe('What to draw on the piece for this step'),
  tool: z.enum(STEP_TOOLS).optional().describe('The main tool: needle means the sewing machine'),
  measurement: z.string().optional().describe('The key number for this step, e.g. "1.5 cm seam"'),
  tip: z.string().optional().describe('An optional helpful tip, one sentence'),
  review: z
    .string()
    .optional()
    .describe('Only when you had to guess or the notes were unclear: say what to check, in one sentence. Leave out otherwise.'),
})

export const guideDraftSchema = z.object({
  reply: z
    .string()
    .describe('One to three calm sentences to the pattern maker: what you wrote or changed, and anything they should check. No exclamation marks.'),
  pieces: z.array(pieceSchema),
  steps: z.array(stepSchema),
})

export type GuideDraft = z.infer<typeof guideDraftSchema>
export type DraftStep = z.infer<typeof stepSchema>
export type DraftPiece = z.infer<typeof pieceSchema>

/** What the editor sends with each request */
export const writeRequestSchema = z.object({
  message: z.string().trim().min(1).max(20_000),
  pattern: z.object({
    name: z.string().max(200),
    category: z.string().max(50),
    difficulty: z.string().max(50),
    pieces: z.array(pieceSchema).max(40),
    steps: z.array(stepSchema).max(200),
  }),
})

export type WriteRequest = z.infer<typeof writeRequestSchema>
