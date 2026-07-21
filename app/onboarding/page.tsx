'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import PrimaryButton from '@/components/ui/PrimaryButton'
import SecondaryButton from '@/components/ui/SecondaryButton'
import BodySilhouette from '@/components/ui/BodySilhouette'

type MeasurementField = 'bust' | 'waist' | 'hips' | 'height' | 'inseam'

const measurementFields: { key: MeasurementField; label: string; hint: string; unit: string }[] = [
  { key: 'bust', label: 'Bust', hint: 'Around the fullest part of your chest', unit: 'cm' },
  { key: 'waist', label: 'Waist', hint: 'Around your natural waist', unit: 'cm' },
  { key: 'hips', label: 'Hips', hint: 'Around the fullest part of your hips', unit: 'cm' },
  { key: 'height', label: 'Height', hint: 'Standing straight without shoes', unit: 'cm' },
  { key: 'inseam', label: 'Inseam', hint: 'From crotch to ankle', unit: 'cm' },
]

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 24 : 8,
            backgroundColor: i === current ? 'var(--sig-primary)' : 'var(--sig-border)',
          }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  )
}

function Screen1({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col h-full px-8 pt-20 pb-12">
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="w-52 h-52">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="90" fill="var(--sig-primary-soft)" />
            {/* Needle */}
            <path d="M70 130 L130 60" stroke="var(--sig-primary)" strokeWidth="4" strokeLinecap="round" />
            <path d="M130 60 L138 55 L133 63 Z" fill="var(--sig-primary)" />
            <circle cx="73" cy="133" r="6" stroke="var(--sig-primary)" strokeWidth="3" fill="none" />
            {/* Thread */}
            <path d="M73 133 Q50 150 55 170 Q65 185 85 175 Q110 160 100 140 Q90 120 110 115 Q130 108 128 90"
              stroke="var(--sig-primary)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Fabric */}
            <path d="M40 155 Q70 145 100 150 Q130 155 160 145 L160 175 Q130 185 100 180 Q70 175 40 185 Z"
              fill="var(--sig-primary)" fillOpacity="0.15" stroke="var(--sig-primary)" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-display font-bold text-ink mb-3 leading-tight">Anyone can sew.</h1>
          <p className="text-body text-ink-2 leading-relaxed max-w-xs">
            Sigrid guides you from idea to finished garment, step by step.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <ProgressDots total={5} current={0} />
        <PrimaryButton onClick={onNext}>Get started</PrimaryButton>
      </div>
    </div>
  )
}

function Screen2({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col h-full px-8 pt-20 pb-12">
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="w-52 h-52">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="90" fill="var(--sig-primary-soft)" />
            {/* Measuring tape */}
            <rect x="30" y="85" width="140" height="30" rx="15" fill="var(--sig-primary)" fillOpacity="0.2" stroke="var(--sig-primary)" strokeWidth="2" />
            {/* Tape markings */}
            {[45, 60, 75, 90, 105, 120, 135, 150].map((x, i) => (
              <line key={x} x1={x} y1="88" x2={x} y2={i % 2 === 0 ? "100" : "96"} stroke="var(--sig-primary)" strokeWidth="1.5" />
            ))}
            {/* Body silhouette hint */}
            <ellipse cx="100" cy="68" rx="18" ry="20" fill="none" stroke="var(--sig-primary-deep)" strokeWidth="1.5" strokeDasharray="4 3" />
            <path d="M82 88 Q100 80 118 88 L120 130 Q100 136 80 130 Z" fill="none" stroke="var(--sig-primary-deep)" strokeWidth="1.5" strokeDasharray="4 3" />
            {/* Checkmark */}
            <circle cx="100" cy="155" r="18" fill="var(--sig-success)" fillOpacity="0.15" stroke="var(--sig-success)" strokeWidth="2" />
            <path d="M91 155 L97 161 L110 148" stroke="var(--sig-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-display font-bold text-ink mb-3 leading-tight">Made for your body.</h1>
          <p className="text-body text-ink-2 leading-relaxed max-w-xs">
            Enter your measurements once and every pattern fits you perfectly.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <ProgressDots total={5} current={1} />
        <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
      </div>
    </div>
  )
}

function Screen3({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col h-full px-8 pt-20 pb-12">
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="w-52 h-52">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="90" fill="var(--sig-primary-soft)" />
            {/* 3D garment preview hint */}
            <path d="M60 80 L80 65 L120 65 L140 80 L140 150 L60 150 Z" fill="var(--sig-primary)" fillOpacity="0.12" stroke="var(--sig-primary)" strokeWidth="1.5" strokeLinejoin="round" />
            {/* Magnifying glass */}
            <circle cx="82" cy="108" r="28" fill="white" fillOpacity="0.85" stroke="var(--sig-primary)" strokeWidth="3" />
            {/* Detail inside magnifier */}
            <path d="M74 108 L80 114 L92 100" stroke="var(--sig-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            {/* Magnifier handle */}
            <line x1="102" y1="128" x2="118" y2="148" stroke="var(--sig-primary)" strokeWidth="5" strokeLinecap="round" />
            {/* Step counter hint */}
            <rect x="110" y="65" width="50" height="22" rx="8" fill="var(--sig-primary)" />
            <text x="135" y="81" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Step 4</text>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-display font-bold text-ink mb-3 leading-tight">We guide every stitch.</h1>
          <p className="text-body text-ink-2 leading-relaxed max-w-xs">
            Follow along as we zoom in on exactly what to do next — no experience needed.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <ProgressDots total={5} current={2} />
        <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
      </div>
    </div>
  )
}

function Screen4({ onNext }: { onNext: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const inputClass = `
    w-full px-4 py-4 rounded-2xl border border-rim bg-surface
    text-body text-ink placeholder:text-ink-3
    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
    transition-all duration-200
  `

  return (
    <div className="flex flex-col h-full px-8 pt-16 pb-12 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-title font-bold text-ink mb-1">Create your account</h1>
        <p className="text-body text-ink-2">Join thousands of makers on Sigrid.</p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <button className="w-full flex items-center justify-center gap-3 bg-ink text-surface py-4 rounded-full text-label font-semibold">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Continue with Apple
        </button>
        <button className="w-full flex items-center justify-center gap-3 bg-surface border border-rim py-4 rounded-full text-label font-semibold text-ink">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-rim" />
        <span className="text-caption text-ink-3">or</span>
        <div className="flex-1 h-px bg-rim" />
      </div>

      <div className="flex flex-col gap-3 mb-8">
        <input
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={inputClass}
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      <ProgressDots total={5} current={3} />
      <div className="mt-6 flex flex-col gap-3">
        <PrimaryButton onClick={onNext}>Create account</PrimaryButton>
        <p className="text-center text-caption text-ink-3">
          Already have an account?{' '}
          <button className="text-primary font-semibold">Sign in</button>
        </p>
      </div>
    </div>
  )
}

function Screen5({ onFinish }: { onFinish: () => void }) {
  const [activeField, setActiveField] = useState<MeasurementField | null>(null)
  const [values, setValues] = useState<Partial<Record<MeasurementField, number>>>({})

  const setValue = (field: MeasurementField, raw: string) => {
    const n = parseFloat(raw)
    setValues((prev) => ({ ...prev, [field]: isNaN(n) ? undefined : n }))
  }

  const inputClass = (field: MeasurementField) => `
    flex-1 px-4 py-3 rounded-xl border
    ${activeField === field ? 'border-primary ring-2 ring-primary/20' : 'border-rim'}
    bg-surface text-body text-ink placeholder:text-ink-3
    focus:outline-none transition-all duration-200
  `

  return (
    <div className="flex flex-col h-full px-6 pt-14 pb-8 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-title font-bold text-ink mb-1">Your measurements</h1>
        <p className="text-body text-ink-2">You can always add these later.</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="w-32 flex-shrink-0 flex items-center justify-center">
          <BodySilhouette activeField={activeField} measurements={values} className="h-52" />
        </div>
        <div className="flex-1 flex flex-col gap-3">
          {measurementFields.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="text-caption font-semibold text-ink-2">{f.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="—"
                  onFocus={() => setActiveField(f.key)}
                  onBlur={() => setActiveField(null)}
                  onChange={(e) => setValue(f.key, e.target.value)}
                  className={inputClass(f.key)}
                />
                <span className="text-caption text-ink-3 w-6">{f.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProgressDots total={5} current={4} />
      <div className="mt-6 flex flex-col gap-3">
        <PrimaryButton onClick={onFinish}>Save measurements</PrimaryButton>
        <SecondaryButton variant="ghost" onClick={onFinish}>Skip for now</SecondaryButton>
      </div>
    </div>
  )
}

const screens = [Screen1, Screen2, Screen3, Screen4, Screen5]

export default function OnboardingPage() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const router = useRouter()

  const next = () => {
    if (current < screens.length - 1) {
      setDirection(1)
      setCurrent((c) => c + 1)
    }
  }

  const finish = () => {
    router.push('/home')
  }

  const Screen = screens[current]
  const isLast = current === screens.length - 1

  return (
    <div className="min-h-screen bg-bg overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="h-screen"
        >
          {isLast ? (
            <Screen5 onFinish={finish} />
          ) : (
            <Screen onNext={next} onFinish={finish} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
