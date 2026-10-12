'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IconArrowLeft, IconNeedleThread, type Icon } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { SizePicker } from '@/components/patterns/size-picker'
import { Wordmark } from '@/components/patterns/wordmark'
import { allSizes, saveSize } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'

// One welcome screen: what Sigrid is, in a sentence
const intro: { icon: Icon; title: string; body: string }[] = [
  { icon: IconNeedleThread, title: 'Sew your own clothes', body: 'Patterns in your size, one calm step at a time.' },
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
          className={cn('h-0.5 transition-all duration-200', i === current ? 'w-8 bg-primary' : 'w-4 bg-indicator')}
        />
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [size, setSize] = useState<StandardSize | null>(null)

  const next = () => setStep((s) => Math.min(s + 1, TOTAL - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))
  const finish = () => {
    if (size) saveSize(size)
    router.push('/home')
  }

  const isIntro = step < ACCOUNT
  const IntroIcon = isIntro ? intro[step].icon : null

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col px-6 pt-4 pb-8">
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
      <div key={step} className="flex flex-1 flex-col animate-in fade-in duration-200">
        {isIntro && IntroIcon && (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <div className="intro-art flex aspect-product w-48 items-center justify-center bg-muted">
              <IntroIcon className="size-20 text-primary" stroke={1.25} aria-hidden />
            </div>
            <div className="flex flex-col gap-3">
              <h1>{intro[step].title}</h1>
              <p className="max-w-xs text-base leading-relaxed text-muted-foreground">{intro[step].body}</p>
            </div>
          </div>
        )}

        {step === ACCOUNT && (
          // Beta: no account and no personal data. Only what's needed: agreeing to the terms.
          <div className="flex flex-1 flex-col gap-6 pt-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Before you start</h1>
              <p className="text-sm text-muted-foreground">
                During the beta there’s no account. Your projects and progress are saved on this device only, and we don’t collect your
                name or email.
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              <li className="rounded-(--control-radius) bg-glass p-3">
                <Link href="/legal/terms" className="underline underline-offset-4">Terms</Link>: how you may use patterns, and that fabric is bought from the shops.
              </li>
              <li className="rounded-(--control-radius) bg-glass p-3">
                <Link href="/legal/privacy" className="underline underline-offset-4">Privacy policy</Link>: what we store and your rights.
              </li>
            </ul>
            <div className="mt-auto flex flex-col gap-3">
              <StepDots current={step} />
              <Button size="lg" className="w-full" onClick={next}>
                Agree and continue
              </Button>
              <p className="text-center text-xs text-muted-foreground">By continuing you agree to the Terms and confirm you’ve read the Privacy policy.</p>
            </div>
          </div>
        )}

        {step === SIZE && (
          <div className="flex flex-1 flex-col gap-6 pt-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">What’s your size?</h1>
              <p className="text-sm text-muted-foreground">
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
    </div>
  )
}
