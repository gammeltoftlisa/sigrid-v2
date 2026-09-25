'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import IconButton from '@/components/ui/IconButton'
import { IconChevronLeft } from '@tabler/icons-react'

const plans = [
  {
    id: 'per-project',
    name: 'Pay per project',
    price: '€7–15',
    period: 'per garment',
    description: 'Perfect for getting started',
    features: [
      'One pattern at a time',
      'Full animated sewing guide',
      'Patterns in sizes XS–XXL',
      'Material guide',
    ],
    accent: 'var(--sig-primary-soft)',
    border: 'var(--sig-primary)',
  },
  {
    id: 'subscription',
    name: 'Monthly subscription',
    price: 'TBD',
    period: 'per month',
    description: 'Unlimited patterns',
    features: [
      'Unlimited patterns',
      'Full animated sewing guide',
      'Priority support',
      'Early access to new features',
    ],
    accent: 'var(--sig-success-soft)',
    border: 'var(--sig-success)',
  },
]

export default function PaymentPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-bg">
      <div className="px-5 pt-14 pb-6">
        <IconButton label="Back" variant="raised" size="md" onClick={() => router.back()} className="mb-5">
          <IconChevronLeft size={18} />
        </IconButton>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-display font-bold text-ink mb-2"
        >
          Choose a plan
        </motion.h1>
        <p className="text-body text-ink-2">Sigrid is currently free — plans coming soon.</p>
      </div>

      {/* Plans */}
      <div className="px-5 flex flex-col gap-4 mb-8">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="bg-surface rounded-3xl p-6 shadow-soft relative overflow-hidden opacity-60"
            style={{ borderTop: `3px solid ${plan.border}` }}
          >
            {/* Coming soon badge */}
            <div className="absolute top-4 right-4">
              <span className="text-[11px] font-semibold bg-warn-soft text-warn px-2.5 py-1 rounded-full">
                Coming soon
              </span>
            </div>

            <div className="mb-4">
              <h2 className="text-heading font-bold text-ink mb-1">{plan.name}</h2>
              <p className="text-caption text-ink-3">{plan.description}</p>
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-display font-bold text-ink">{plan.price}</span>
              <span className="text-body text-ink-3">{plan.period}</span>
            </div>

            <ul className="space-y-2.5 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: plan.border + '20' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M20 7L9 18L4 13" stroke={plan.border} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-label text-ink-2">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full py-4 rounded-full text-label font-semibold bg-surface-2 text-ink-3 cursor-not-allowed"
            >
              Coming soon
            </button>
          </motion.div>
        ))}
      </div>

      {/* Beta note */}
      <div className="px-5 pb-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-primary-soft rounded-3xl p-5 text-center"
        >
          <p className="text-heading text-primary mb-1">🎉 You&apos;re in beta</p>
          <p className="text-body text-ink-2">
            Everything is free while we&apos;re building. Enjoy full access — no card required.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
