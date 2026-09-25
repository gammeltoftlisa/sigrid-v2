'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import SizePicker from '@/components/ui/SizePicker'
import { allSizes, loadSavedSize, saveSize, sizeLabel } from '@/lib/sizes'
import type { StandardSize } from '@/lib/types'
import { creators } from '@/lib/data'
import { TAP, cardInteractive } from '@/components/ui/interaction'

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      whileTap={TAP}
      className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${checked ? 'bg-primary hover:bg-primary-deep' : 'bg-rim hover:bg-ink-3/40'}`}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="absolute top-[3px] w-[22px] h-[22px] bg-surface rounded-full shadow-soft"
      />
    </motion.button>
  )
}

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(true)
  const [followedCreators] = useState(creators.slice(0, 2))

  const [size, setSize] = useState<StandardSize | null>(null)

  useEffect(() => setSize(loadSavedSize()), [])

  const handleSelectSize = (s: StandardSize) => {
    setSize(s)
    saveSize(s)
  }

  return (
    <div className="min-h-full bg-bg">
      <div className="px-5 pt-14 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-display font-bold text-ink"
        >
          Profile
        </motion.h1>
      </div>

      {/* User card */}
      <div className="px-5 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-3xl p-5 shadow-soft flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-full bg-primary-soft flex items-center justify-center text-[28px] font-bold text-primary">
            E
          </div>
          <div>
            <h2 className="text-heading font-semibold text-ink">Emma</h2>
            <p className="text-caption text-ink-3">emma@example.com</p>
          </div>
        </motion.div>
      </div>

      {/* Size */}
      <div className="px-5 mb-6">
        <h2 className="text-heading font-semibold text-ink mb-4">My size</h2>
        <div className="bg-surface rounded-3xl p-5 shadow-soft">
          <p className="text-caption text-ink-3 mb-4">
            {size
              ? `Patterns start in ${sizeLabel(size)}. You can still pick another size per garment.`
              : 'Pick your usual size and we\'ll pre-select it for every pattern.'}
          </p>
          <SizePicker sizes={allSizes} selected={size} onSelect={handleSelectSize} />
        </div>
      </div>

      {/* Preferences */}
      <div className="px-5 mb-6">
        <h2 className="text-heading font-semibold text-ink mb-4">Preferences</h2>
        <div className="bg-surface rounded-3xl shadow-soft overflow-hidden divide-y divide-rim-soft">
          {/* Notifications */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-label font-medium text-ink">Push notifications</p>
              <p className="text-caption text-ink-3">Sewing tips and reminders</p>
            </div>
            <Toggle checked={notifications} onChange={setNotifications} />
          </div>
        </div>
      </div>

      {/* Payment */}
      <div className="px-5 mb-6">
        <h2 className="text-heading font-semibold text-ink mb-4">Subscription</h2>
        <Link href="/payment" className="block rounded-3xl">
          <div className={`bg-surface rounded-3xl p-5 shadow-soft flex items-center justify-between ${cardInteractive}`}>
            <div>
              <p className="text-label font-medium text-ink">Beta access</p>
              <p className="text-caption text-ink-3">Payment coming soon</p>
            </div>
            <span className="text-[12px] font-semibold bg-warn-soft text-warn px-2.5 py-1 rounded-full">
              Coming soon
            </span>
          </div>
        </Link>
      </div>

      {/* Creators I follow */}
      <div className="px-5 mb-6">
        <h2 className="text-heading font-semibold text-ink mb-4">Creators I follow</h2>
        <div className="flex flex-col gap-3">
          {followedCreators.map((creator) => (
            <Link key={creator.id} href={`/creator/${creator.id}`} className="block rounded-2xl">
              <div className={`bg-surface rounded-2xl p-4 shadow-soft flex items-center gap-3 ${cardInteractive}`}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-surface font-bold"
                  style={{ backgroundColor: creator.avatarColor }}
                >
                  {creator.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label font-semibold text-ink">{creator.handle}</p>
                  <p className="text-caption text-ink-3">{creator.followerCount} followers</p>
                </div>
                {creator.isCertified && (
                  <span className="text-[10px] font-semibold bg-primary-soft text-primary px-2 py-0.5 rounded-full">
                    ✓ Certified
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Sign out */}
      <div className="px-5 pb-8">
        <button className="w-full py-4 rounded-full text-danger text-label font-semibold hover:bg-danger-soft active:scale-[0.97] transition duration-150">
          Sign out
        </button>
      </div>
    </div>
  )
}
