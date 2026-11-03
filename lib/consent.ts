import { z } from 'zod'

/**
 * What people agree to, each recorded on its own (lib/consent-db.ts), so nothing is bundled:
 *   terms      the Terms of service, required to use Sigrid
 *   age        that they're 13 or older, required: Sigrid collects no children's data
 *   analytics  Vercel Web Analytics, optional, off until they accept
 *   marketing  emails about new patterns and offers, optional, off until they opt in
 * Every answer is kept with who, what, which version of the text and when, as proof of consent.
 */
export const consentKinds = ['terms', 'age', 'analytics', 'marketing'] as const
export type ConsentKind = (typeof consentKinds)[number]

/** Bump a version when its text changes in a way people must agree to again */
export const consentVersions: Record<ConsentKind, string> = {
  terms: '2026-11-02',
  age: '2026-11-02',
  analytics: '2026-11-02',
  marketing: '2026-11-02',
}

/** Where an answer was given, kept with it */
export const consentSources = ['onboarding', 'banner', 'settings'] as const

export const consentRequestSchema = z.object({
  entries: z
    .array(z.object({ kind: z.enum(consentKinds), granted: z.boolean(), source: z.enum(consentSources) }))
    .min(1)
    .max(consentKinds.length),
})

export type ConsentState = Partial<Record<ConsentKind, { granted: boolean; version: string; at: string }>>

/** An answer only counts for the version of the text it was given to */
export const isCurrent = (state: ConsentState, kind: ConsentKind) => state[kind]?.version === consentVersions[kind]
export const hasGranted = (state: ConsentState, kind: ConsentKind) => isCurrent(state, kind) && state[kind]?.granted === true
