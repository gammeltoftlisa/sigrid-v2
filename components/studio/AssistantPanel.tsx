'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { IconArrowBackUp, IconPlayerStop, IconSparkles } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/patterns/status-badge'
import { StatusMessage } from '@/components/patterns/status-message'
import { EXAMPLE_NOTES, type StudioMessage } from '@/lib/studio/patterns'

/**
 * The studio assistant: the maker writes their instructions (or asks for a
 * change) and the guide on the right is written live. The maker always reads
 * it through afterwards; steps the assistant guessed at are flagged.
 */
export function AssistantPanel({
  messages,
  hasGuide,
  streaming,
  streamingReply,
  error,
  reviewCount,
  canUndo,
  onSend,
  onStop,
  onUndo,
  onShowReview,
  disabled,
  className,
}: {
  messages: StudioMessage[]
  hasGuide: boolean
  streaming: boolean
  /** The reply as it streams in */
  streamingReply?: string
  error?: string
  /** Steps flagged "Needs a look" */
  reviewCount: number
  canUndo: boolean
  onSend: (text: string) => void
  onStop: () => void
  onUndo: () => void
  onShowReview: () => void
  /** Switched off for now: the panel only says what is coming */
  disabled?: boolean
  className?: string
}) {
  const [text, setText] = useState('')
  const inputId = useId()
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, streamingReply])

  const send = () => {
    const t = text.trim()
    if (!t || streaming) return
    onSend(t)
    setText('')
  }

  return (
    <section aria-label="Assistant" className={cn('glass-panel flex min-h-0 flex-col overflow-hidden rounded-(--radius)', className)}>
      <header className="flex items-center gap-2 px-4 pt-4 pb-3">
        <IconSparkles className="size-4 text-muted-foreground" aria-hidden />
        <h2 className="eyebrow !font-medium text-muted-foreground">Assistant</h2>
        {disabled && <StatusBadge className="ml-auto">Coming soon</StatusBadge>}
      </header>

      {disabled ? (
        <div className="flex flex-1 flex-col gap-3 px-3 pb-3">
          <div className="flex flex-col gap-3 rounded-(--control-radius) bg-card p-4 text-sm">
            <p>Soon you can give the assistant your notes and it drafts the whole guide for you to read through.</p>
            <p className="text-muted-foreground">For now, build the guide by hand: add sections and steps in the outline, and the pieces under Pieces.</p>
          </div>
        </div>
      ) : (
      <>

      <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-3" aria-live="polite">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col gap-3 rounded-(--control-radius) bg-card p-4 text-sm">
            <p>Write your instructions the way you would for yourself: the pieces with their sizes, the seam allowance and the sewing order.</p>
            <p className="text-muted-foreground">I write them up as a guide on the right. Read it through, change anything by hand, or ask me for changes here.</p>
            <Button variant="outline" size="sm" className="self-start" onClick={() => setText(EXAMPLE_NOTES)}>
              Use example notes
            </Button>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === 'maker' ? (
            <p key={i} className="ml-8 self-end whitespace-pre-line rounded-(--control-radius) bg-card px-3 py-2 text-sm line-clamp-6">
              {m.text}
            </p>
          ) : (
            <p key={i} className="max-w-prose px-1 text-sm text-foreground/80">
              {m.text}
            </p>
          ),
        )}

        {streaming && (
          <div className="flex items-start gap-2 px-1 text-sm text-foreground/80">
            <Spinner className="mt-0.5 size-4 shrink-0" />
            <p>{streamingReply || 'Writing the guide…'}</p>
          </div>
        )}

        {!streaming && canUndo && (
          <Button variant="ghost" size="sm" className="self-start" onClick={onUndo}>
            <IconArrowBackUp data-icon="inline-start" />
            Undo this change
          </Button>
        )}

        {error && <StatusMessage status="error" title="The assistant could not write this">{error}</StatusMessage>}
      </div>

      {!streaming && reviewCount > 0 && (
        <div className="px-3 pb-3">
          <StatusMessage
            status="warning"
            title={reviewCount === 1 ? '1 step needs a look' : `${reviewCount} steps need a look`}
            action={
              <Button variant="outline" size="sm" onClick={onShowReview}>
                Show
              </Button>
            }
          />
        </div>
      )}

      <div className="flex flex-col gap-2 px-3 pb-3">
        <Field>
          <FieldLabel htmlFor={inputId}>{hasGuide ? 'Ask for a change' : 'Your instructions'}</FieldLabel>
          <Textarea
            id={inputId}
            value={text}
            disabled={streaming}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send()
            }}
            placeholder={hasGuide ? 'Split step 6 in two and add a tip about pressing seams open.' : 'Pieces, seam allowance, then the sewing order…'}
            className="max-h-64 bg-card"
          />
          <FieldDescription>Press ⌘ Enter to send.</FieldDescription>
        </Field>
        {streaming ? (
          <Button variant="outline" size="lg" onClick={onStop}>
            <IconPlayerStop data-icon="inline-start" />
            Stop writing
          </Button>
        ) : (
          <Button size="lg" disabled={!text.trim()} onClick={send}>
            <IconSparkles data-icon="inline-start" />
            {hasGuide ? 'Send' : 'Write the guide'}
          </Button>
        )}
      </div>
      </>
      )}
    </section>
  )
}
