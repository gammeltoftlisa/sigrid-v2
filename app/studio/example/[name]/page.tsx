'use client'

import { use, useEffect, useRef } from 'react'
import { notFound, useRouter } from 'next/navigation'

import { deletePattern, loadPatterns, savePattern, type StudioPattern } from '@/lib/studio/patterns'
import { SARATOGA } from '@/lib/studio/examples/saratoga'

const EXAMPLES: Record<string, Omit<StudioPattern, 'id' | 'updatedAt'>> = { saratoga: SARATOGA }

/**
 * Development only: adds an example pattern to this browser's studio as the maker's own,
 * then opens the pattern list. Each visit adds one copy. With `?tidy` it adds nothing and instead
 * removes copies made from an older version of the example (same name, a different number of steps), so edits to the current one are safe.
 */
export default function ExamplePattern({ params, searchParams }: { params: Promise<{ name: string }>; searchParams: Promise<{ tidy?: string }> }) {
  const { name } = use(params)
  const tidy = use(searchParams).tidy !== undefined
  const router = useRouter()
  const example = EXAMPLES[name]
  if (process.env.NODE_ENV === 'production' || !example) notFound()

  // Development runs effects twice; add it once
  const added = useRef(false)
  useEffect(() => {
    if (added.current) return
    added.current = true
    if (tidy) {
      const current = example.steps.length
      for (const p of loadPatterns()) if (p.name === example.name && p.steps.length !== current) deletePattern(p.id)
      router.replace('/studio')
      return
    }
    savePattern({ ...structuredClone(example), id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, updatedAt: Date.now() })
    router.replace('/studio')
  }, [example, router, tidy])

  return <p className="p-8 text-sm text-muted-foreground">{tidy ? 'Removing old copies…' : 'Adding the example pattern…'}</p>
}
