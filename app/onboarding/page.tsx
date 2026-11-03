'use client'

import { Suspense, useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { IconArrowLeft, IconNeedleThread, type Icon } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useConsent } from '@/components/consent'
import { SizePicker } from '@/components/patterns/size-picker'
import { Wordmark } from '@/components/patterns/wordmark'
import { writeRaw } from '@/lib/local-store'
import { allSizes, saveSize } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'

// One welcome screen: what Sigrid is, in a sentence
const intro: { icon: Icon; title: React.ReactNode; body: string }[] = [
  { icon: IconNeedleThread, title: <>Sew your <em className="display-italic">own clothes</em></>, body: 'Patterns in your size, one calm step at a time.' },
]
const ACCOUNT = intro.length
const SIZE = ACCOUNT + 1
const TOTAL = SIZE + 1

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2" role="img" aria-label={`Step ${current + 1} of ${TOTAL}`}>
      {Array.from({ length: TOTAL }, (_, i) => (
        <span
          key={i}
          className={cn('stitch-dot h-0.5 transition-all duration-200', i === current ? 'w-8 bg-foreground' : 'w-4 bg-indicator')}
        />
      ))}
    </div>
  )
}

/** One unticked box with its own words. Ticking is always the person's own act. */
function Agreement({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-(--control-radius) border border-dashed p-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(c === true)} className="mt-0.5" />
      <span>{children}</span>
    </label>
  )
}

function Onboarding() {
  const router = useRouter()
  // Sent back here to agree to new terms: straight to the agreement, then back to Sigrid
  const reAgree = useSearchParams().get('agree') === '1'
  const [step, setStep] = useState(reAgree ? ACCOUNT : 0)
  const [size, setSize] = useState<StandardSize | null>(null)
  const { answer } = useConsent()
  // Never ticked in advance
  const [age, setAge] = useState(false)
  const [terms, setTerms] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [saving, setSaving] = useState(false)

  // The two required answers and the optional one are recorded separately, each with its own version and time
  const agree = async () => {
    setSaving(true)
    try {
      await answer([
        { kind: 'age', granted: age },
        { kind: 'terms', granted: terms },
        { kind: 'marketing', granted: marketing },
      ], 'onboarding')
      if (reAgree) router.replace('/home')
      else next()
    } catch {
      toast.error('Couldn’t save your answers, so you can’t continue yet. This is usually a connection problem.', {
        action: { label: 'Try again', onClick: () => void agree() },
      })
    } finally {
      setSaving(false)
    }
  }

  const next = () => setStep((s) => Math.min(s + 1, TOTAL - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))
  const finish = () => {
    if (size) saveSize(size)
    // So the site's address goes straight to Home next time
    writeRaw('sigrid_welcomed', '1')
    // Nothing to show on Home yet: the first thing to do is find a pattern
    router.push('/explore')
  }

  const isIntro = step < ACCOUNT
  const IntroIcon = isIntro ? intro[step].icon : null

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col px-6 pt-4 pb-8">
      <div className="flex h-12 items-center justify-between">
        {step > 0 ? (
          <Button variant="ghost" size="icon-lg" aria-label="Back" className="-ml-2" onClick={back}>
            <IconArrowLeft />
          </Button>
        ) : (
          <Wordmark />
        )}
      </div>

      {/* Fade between steps; reduced motion turns it off globally */}
      <div key={step} className="flex flex-1 flex-col">
        {isIntro && IntroIcon && (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <div className="intro-art flex aspect-product w-48 items-center justify-center bg-muted">
              <IntroIcon className="size-20 text-primary" stroke={1.25} aria-hidden />
            </div>
            <div className="flex flex-col gap-3">
              <h1>{intro[step].title}</h1>
              <p className="mx-auto max-w-xs text-base text-muted-foreground">{intro[step].body}</p>
            </div>
          </div>
        )}

        {step === ACCOUNT && (
          // Only what's needed: two required answers, and one optional that's entirely separate
          <div className="flex flex-1 flex-col gap-6 pt-6">
            <div className="flex flex-col gap-2">
              <h1>Before you <em className="display-italic">start</em></h1>
              <p className="text-base text-muted-foreground">
                {reAgree
                  ? 'Our terms have changed. Please read them and agree again to keep using Sigrid.'
                  : 'Your projects and progress are saved on your account, so they follow you to all your devices.'}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Agreement checked={age} onChange={setAge}>I’m 13 or older.</Agreement>
              <Agreement checked={terms} onChange={setTerms}>
                I agree to the <Link href="/legal/terms" target="_blank" rel="noopener" className="underline underline-offset-4">Terms</Link> and have read the{' '}
                <Link href="/legal/privacy" target="_blank" rel="noopener" className="underline underline-offset-4">Privacy policy</Link>.
              </Agreement>
              <p className="eyebrow pt-3 text-muted-foreground">Optional</p>
              <Agreement checked={marketing} onChange={setMarketing}>
                Email me about new patterns and offers. You can stop anytime in Settings.
              </Agreement>
            </div>
            <div className="mt-auto flex flex-col gap-3">
              {!reAgree && <StepDots current={step} />}
              <Button size="lg" className="w-full" disabled={!age || !terms || saving} onClick={agree}>
                Continue
              </Button>
              {!age && <p className="text-center text-xs text-muted-foreground">Sigrid is for people 13 and older, so it collects no children’s data.</p>}
            </div>
          </div>
        )}

        {step === SIZE && (
          <div className="flex flex-1 flex-col gap-6 pt-6">
            <div className="flex flex-col gap-2">
              <h1>What’s your <em className="display-italic">size</em>?</h1>
              <p className="text-base text-muted-foreground">
                The size you usually buy. You can change it anytime.
              </p>
            </div>
            <SizePicker sizes={allSizes} value={size} onValueChange={setSize} label="Your usual size" />
          </div>
        )}
      </div>

      {step !== ACCOUNT && (
        <div className="flex flex-col gap-4 pt-6">
          <StepDots current={step} />
          {step === SIZE ? (
            <div className="flex flex-col gap-2">
              <Button size="lg" className="w-full" disabled={!size} onClick={finish}>
                Save my size
              </Button>
              <Button size="lg" variant="ghost" className="w-full" onClick={finish}>
                Skip for now
              </Button>
            </div>
          ) : (
            <Button size="lg" className="w-full" onClick={next}>
              {step === 0 ? 'Get started' : 'Continue'}
            </Button>
          )}
        </div>
      )}
    </main>
  )
}

// Reading the address (?agree=1) needs a Suspense boundary, or the build can't prerender the page
export default function OnboardingPage() {
  return (
    <Suspense>
      <Onboarding />
    </Suspense>
  )
}
