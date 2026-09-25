'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import ProgressBar from '@/components/ui/ProgressBar'
import DifficultyBadge from '@/components/ui/DifficultyBadge'
import PrimaryButton from '@/components/ui/PrimaryButton'
import { activeProject, completedProjects } from '@/lib/data'
import { cardInteractive } from '@/components/ui/interaction'

export default function ProjectsPage() {
  return (
    <div className="min-h-full bg-bg">
      <div className="px-5 pt-14 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-display font-bold text-ink"
        >
          My Projects
        </motion.h1>
      </div>

      {/* Active projects */}
      <div className="px-5 mb-8">
        <h2 className="text-heading font-semibold text-ink mb-4">In progress</h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface rounded-3xl p-5 shadow-card"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-primary-soft rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg width="32" height="32" viewBox="0 0 120 120" fill="none">
                <path d="M28 30 L20 52 L37 54 L37 96 L83 96 L83 54 L100 52 L92 30 L75 38 Q60 44 45 38 Z"
                  fill="var(--sig-primary)" fillOpacity="0.35" stroke="var(--sig-primary)" strokeWidth="3" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-label font-semibold text-ink">{activeProject.garmentName}</h3>
                <DifficultyBadge difficulty={activeProject.difficulty} />
              </div>
              <p className="text-caption text-ink-3">
                Started {new Date(activeProject.startedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <ProgressBar percent={activeProject.progressPercent} showLabel className="mb-4" />
          <PrimaryButton href={`/garment/${activeProject.garmentId}`}>Continue sewing</PrimaryButton>
        </motion.div>
      </div>

      {/* Completed projects */}
      <div className="px-5 pb-8">
        <h2 className="text-heading font-semibold text-ink mb-4">Completed</h2>

        {completedProjects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-body text-ink-3">Your finished garments will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {completedProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
              >
                <Link href={`/garment/${project.garmentId}`} className="block rounded-3xl">
                  <div className={`bg-surface rounded-3xl overflow-hidden shadow-soft border border-rim-soft ${cardInteractive}`}>
                    <div
                      className="h-40 flex items-center justify-center"
                      style={{ backgroundColor: project.userPhotoColor + '30' }}
                    >
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: project.userPhotoColor }}
                      >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <path d="M20 7L9 18L4 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-label font-semibold text-ink mb-1">{project.garmentName}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-caption text-ink-3">
                          {project.completedAt
                            ? new Date(project.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                            : ''}
                        </span>
                        <DifficultyBadge difficulty={project.difficulty} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Start new project prompt */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-primary-soft rounded-3xl p-5 text-center"
        >
          <p className="text-body font-semibold text-ink mb-1">Ready to make more?</p>
          <p className="text-caption text-ink-2 mb-4">Browse hundreds of patterns for your next project.</p>
          <PrimaryButton href="/explore">Explore patterns</PrimaryButton>
        </motion.div>
      </div>
    </div>
  )
}
