'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import PatternCard from '@/components/ui/PatternCard'
import CreatorCard from '@/components/ui/CreatorCard'
import { creatorPatterns, creators } from '@/lib/data'
import type { Difficulty, GarmentCategory } from '@/lib/types'

const categories: (GarmentCategory | 'All')[] = ['All', 'Tops', 'Bottoms', 'Dresses', 'Outerwear']
const difficulties: (Difficulty | 'All')[] = ['All', 'Beginner', 'Intermediate', 'Advanced']

export default function ExplorePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<GarmentCategory | 'All'>('All')
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All')

  const filtered = creatorPatterns.filter((p) => {
    if (category !== 'All' && p.category !== category) return false
    if (difficulty !== 'All' && p.difficulty !== difficulty) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="min-h-full bg-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-5">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-display font-bold text-ink mb-5"
        >
          Discover patterns.
        </motion.h1>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M16.5 16.5L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="Search patterns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-surface rounded-2xl border border-rim text-body text-ink placeholder:text-ink-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-5 mb-6 flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-label font-medium transition-colors duration-200 ${
                category === cat ? 'bg-primary text-surface' : 'bg-surface-2 text-ink-2 hover:bg-rim hover:text-ink'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {difficulties.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-label font-medium transition-colors duration-200 ${
                difficulty === d ? 'bg-primary text-surface' : 'bg-surface-2 text-ink-2 hover:bg-rim hover:text-ink'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Featured creators */}
      <div className="mb-8">
        <div className="px-5 flex items-center justify-between mb-4">
          <h2 className="text-heading font-semibold text-ink">Featured creators</h2>
        </div>
        <div className="flex gap-6 overflow-x-auto px-5 pb-2">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} variant="horizontal" />
          ))}
        </div>
      </div>

      {/* Pattern grid */}
      <div className="px-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading font-semibold text-ink">
            {filtered.length} pattern{filtered.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-heading text-ink-3">No patterns found</p>
            <p className="text-body text-ink-3 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((pattern, i) => (
              <motion.div
                key={pattern.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <PatternCard pattern={pattern} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
