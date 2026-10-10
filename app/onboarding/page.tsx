'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconArrowLeft, IconNeedleThread, IconRoute, IconRuler2, type Icon } from '@tabler/icons-react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { SizePicker } from '@/components/patterns/size-picker'
import { Wordmark } from '@/components/patterns/wordmark'
import { allSizes, saveSize } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'

const intro: { icon: Icon; title: string; body: string }[] = [
  { icon: IconNeedleThread, title: 'Anyone can sew', body: 'No experience needed. We take you from the first cut to a finished garment, one small step at a time.' },
  { icon: IconRuler2, title: 'Made in your size', body: 'Choose your size once and every pattern is ready in it. No guessing, no resizing.' },
  { icon: IconRoute, title: 'Calm, clear steps', body: 'Each step shows exactly what to do and where. If something goes wrong, most seams can be unpicked and sewn again.' },
]
const ACCOUNT = intro.length
const SIZE = ACCOUNT + 1
const TOTAL = SIZE + 1

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5" role="img" aria-label={`Step ${current + 1} of ${TOTAL}`}>
      {Array.from({ length: TOTAL }, (_, i) => (
        <span
          key={i}
          className={cn('h-0.5 transition-all duration-200', i === current ? 'w-8 bg-primary' : 'w-4 bg-border')}
        />
      ))}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
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
        {isIntro && (
          <Button variant="ghost" onClick={() => setStep(ACCOUNT)}>
            Skip
          </Button>
        )}
      </div>

      {/* Fade between steps; reduced motion turns it off globally */}
      <div key={step} className="flex flex-1 flex-col animate-in fade-in duration-200">
        {isIntro && IntroIcon && (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
            <div className="intro-art flex aspect-[4/5] w-48 items-center justify-center bg-muted">
              <IntroIcon className="size-20 text-primary" stroke={1.25} aria-hidden />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight">{intro[step].title}</h1>
              <p className="max-w-xs text-base leading-relaxed text-muted-foreground">{intro[step].body}</p>
            </div>
          </div>
        )}

        {step === ACCOUNT && (
          <form
            className="flex flex-1 flex-col gap-6 pt-6"
            onSubmit={(e) => {
              e.preventDefault()
              next()
            }}
          >
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
              <p className="text-sm text-muted-foreground">So your progress is never lost. We only use your email to sign you in.</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button type="button" size="lg" variant="outline" className="w-full" onClick={next}>
                <AppleMark />
                Continue with Apple
              </Button>
              <Button type="button" size="lg" variant="outline" className="w-full" onClick={next}>
                <GoogleMark />
                Continue with Google
              </Button>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or with email
              <span className="h-px flex-1 bg-border" />
            </div>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="first-name">First name</FieldLabel>
                <Input id="first-name" autoComplete="given-name" className="h-11" />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input id="email" type="email" autoComplete="email" className="h-11" />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input id="password" type="password" autoComplete="new-password" className="h-11" />
              </Field>
            </FieldGroup>
            <div className="mt-auto flex flex-col gap-3">
              <StepDots current={step} />
              <Button type="submit" size="lg" className="w-full">
                Create account
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Button type="button" variant="link" className="h-auto p-0" onClick={next}>
                  Sign in
                </Button>
              </p>
            </div>
          </form>
        )}

        {step === SIZE && (
          <div className="flex flex-1 flex-col gap-6 pt-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">What’s your size?</h1>
              <p className="text-sm text-muted-foreground">
                Choose the size you usually buy. Between two? Pick the larger one, it’s easier to take in. You can change this anytime.
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
