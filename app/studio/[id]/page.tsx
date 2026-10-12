'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { IconArrowLeft, IconArrowRight, IconCircleCheck, IconPencil, IconX } from '@tabler/icons-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { StatusMessage } from '@/components/patterns/status-message'
import { PatternPreview } from '@/components/studio/PatternPreview'
import { BasicsForm, DescribeForm, MaterialsForm, PiecesForm, SizesForm } from '@/components/studio/StepForms'
import { StudioGuide } from '@/components/studio/StudioGuide'
import { WizardStepper } from '@/components/studio/WizardStepper'
import { loadPattern, savePattern, withDerived, type StudioPattern } from '@/lib/studio/patterns'
import { WIZARD, firstOpenStep, isDone, missingFor, type WizardStep } from '@/lib/studio/wizard'

/**
 * The studio: a pattern maker goes through a few short steps, from a name to a
 * pattern ready to sell. Each step shows how it will look for sewers.
 */
export default function StudioEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [pattern, setPattern] = useState<StudioPattern | null>(null)
  const [missing, setMissing] = useState(false)
  const [step, setStep] = useState<WizardStep>('basics')

  useEffect(() => {
    const p = loadPattern(id)
    // Patterns live in localStorage, which can only be read after hydration
    /* eslint-disable react-hooks/set-state-in-effect */
    if (p) {
      setPattern(p)
      setStep(firstOpenStep(p))
    } else setMissing(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [id])

  // Every change is kept straight away
  useEffect(() => {
    if (pattern) savePattern(pattern)
  }, [pattern])

  const change = (patch: Partial<StudioPattern>) =>
    // Any change after it was marked ready puts it back to draft, so nothing unchecked goes out
    setPattern((p) => (p ? withDerived({ ...p, ...patch, status: patch.status ?? 'draft', updatedAt: Date.now() }) : p))

  if (missing) {
    return (
      <main className="flex min-h-dvh items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>This pattern isn’t here</EmptyTitle>
            <EmptyDescription>It may have been deleted, or it was made in another browser.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/studio" />}>
              Go to the studio
            </Button>
          </EmptyContent>
        </Empty>
      </main>
    )
  }
  if (!pattern) return null

  const index = WIZARD.findIndex((s) => s.id === step)
  const meta = WIZARD[index]
  const todo = missingFor(step, pattern)
  const openSteps = WIZARD.filter((s) => s.id !== 'publish' && !isDone(s.id, pattern))

  const go = (next: WizardStep) => {
    setStep(next)
    document.getElementById('studio-main')?.scrollTo({ top: 0 })
  }

  const publish = () => {
    change({ status: 'ready' })
    toast.success('Ready to publish.')
  }

  const form =
    step === 'basics' ? <BasicsForm pattern={pattern} onChange={change} />
    : step === 'describe' ? <DescribeForm pattern={pattern} onChange={change} />
    : step === 'sizes' ? <SizesForm pattern={pattern} onChange={change} />
    : step === 'materials' ? <MaterialsForm pattern={pattern} onChange={change} />
    : step === 'pieces' ? <PiecesForm pattern={pattern} onChange={change} />
    : null

  const preview = (
    <aside aria-label="What sewers see" className="glass-panel flex flex-col gap-3 rounded-(--radius) p-4 lg:sticky lg:top-0 lg:col-span-5">
      <p className="eyebrow text-muted-foreground">What sewers see</p>
      <PatternPreview pattern={pattern} />
    </aside>
  )

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Top: back, which pattern, the steps */}
      <header className="mx-auto flex w-full max-w-6xl shrink-0 flex-col gap-3 px-3 pt-3 md:flex-row md:items-center md:gap-6 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" size="icon-lg" aria-label="Back to the studio" nativeButton={false} render={<Link href="/studio" />}>
            <IconX />
          </Button>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-sm font-semibold">{pattern.name}</p>
            <p className="truncate text-xs whitespace-nowrap text-muted-foreground tabular-nums">
              {pattern.status === 'ready' ? 'Ready to publish' : `Step ${index + 1} of ${WIZARD.length} · saved`}
            </p>
          </div>
        </div>
        <div className="md:ml-auto">
          <WizardStepper steps={WIZARD} current={step} isDone={(s) => isDone(s, pattern)} onSelect={go} />
        </div>
      </header>

      <main id="studio-main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-6 md:px-6">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{meta.title}</h1>
          <p className="max-w-prose text-base text-muted-foreground">{meta.intro}</p>
        </div>

        {step === 'guide' ? (
          <div className="flex min-h-144 flex-1 flex-col">
            <StudioGuide pattern={pattern} onChange={change} />
          </div>
        ) : step === 'publish' ? (
          <div className="grid items-start gap-6 lg:grid-cols-12">
            <div className="flex flex-col gap-3 lg:col-span-7">
              {openSteps.length > 0 ? (
                <StatusMessage status="warning" title={openSteps.length === 1 ? 'One step still needs something' : `${openSteps.length} steps still need something`}>
                  Finish them, then come back here to publish.
                </StatusMessage>
              ) : pattern.status === 'ready' ? (
                <StatusMessage status="success" title="Ready to publish">
                  Everything is filled in. Changing anything puts it back to draft.
                </StatusMessage>
              ) : (
                <StatusMessage status="info" title="Everything is filled in">
                  Look it over, then mark it ready.
                </StatusMessage>
              )}
              <ol className="flex flex-col gap-2">
                {WIZARD.filter((s) => s.id !== 'publish').map((s, i) => {
                  const left = missingFor(s.id, pattern)
                  return (
                    <li key={s.id} className="flex items-center gap-3 rounded-(--control-radius) bg-card p-3">
                      <span
                        className={
                          left.length
                            ? 'flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium'
                            : 'flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary'
                        }
                      >
                        {left.length ? i + 1 : <IconCircleCheck className="size-4" aria-label="Done" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{s.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{left.length ? `Add ${left.join(' and ')}` : 'Done'}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => go(s.id)}>
                        <IconPencil data-icon="inline-start" />
                        {left.length ? 'Finish' : 'Edit'}
                      </Button>
                    </li>
                  )
                })}
              </ol>
            </div>
            {preview}
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-12">
            <div className="flex max-w-xl flex-col gap-5 lg:col-span-7">{form}</div>
            {preview}
          </div>
        )}
        </div>
      </main>

      {/* Bottom: back, what's still needed here, the one main action */}
      <footer className="mx-auto flex w-full max-w-6xl shrink-0 items-center gap-3 px-3 py-3 md:px-6">
        <Button variant="outline" size="lg" disabled={index === 0} onClick={() => go(WIZARD[index - 1].id)}>
          <IconArrowLeft data-icon="inline-start" />
          Back
        </Button>
        <p className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground sm:block" aria-live="polite">
          {step !== 'publish' && (todo.length ? `Still needed: ${todo.join(', ')}` : 'This step is done')}
        </p>
        <div className="ml-auto">
          {step === 'publish' ? (
            pattern.status === 'ready' ? (
              <Button size="lg" variant="outline" onClick={() => change({ status: 'draft' })}>
                Back to draft
              </Button>
            ) : (
              <Button size="lg" disabled={openSteps.length > 0} onClick={publish}>
                <IconCircleCheck data-icon="inline-start" />
                Mark ready to publish
              </Button>
            )
          ) : (
            <Button size="lg" onClick={() => go(WIZARD[index + 1].id)}>
              Continue
              <IconArrowRight data-icon="inline-end" />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
