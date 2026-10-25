'use client'

import { use, useEffect, useRef } from 'react'
import { notFound, useRouter } from 'next/navigation'

import { savePattern, type StudioPattern } from '@/lib/studio/patterns'
import { SARATOGA } from '@/lib/studio/examples/saratoga'

const EXAMPLES: Record<string, Omit<StudioPattern, 'id' | 'updatedAt'>> = { saratoga: SARATOGA }

/**
 * Development only: adds an example pattern to this browser's studio as the maker's own,
 * then opens the pattern list. Each visit adds one copy.
 */
export default function ExamplePattern({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params)
  const router = useRouter()
  const example = EXAMPLES[name]
  if (process.env.NODE_ENV === 'production' || !example) notFound()

  // Development runs effects twice; add it once
  const added = useRef(false)
  useEffect(() => {
    if (added.current) return
    added.current = true
    savePattern({ ...structuredClone(example), id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, updatedAt: Date.now() })
    router.replace('/studio')
  }, [example, router])

  return <p className="p-8 text-sm text-muted-foreground">Adding the example pattern…</p>
}
