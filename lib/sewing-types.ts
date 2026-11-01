import { z } from 'zod'

const sizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
const garmentId = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/)
const timestamp = z.iso.datetime()

/** What a device and an account exchange. The account always comes from the session, never from here. */
export const sewingStateSchema = z.strictObject({
  projects: z.array(z.strictObject({
    garmentId,
    size: z.enum(sizes),
    completedUntil: z.number().int().min(0).max(1000),
    updatedAt: timestamp,
  })).max(500),
  activity: z.array(z.strictObject({
    garmentId,
    step: z.number().int().min(0).max(1000),
    action: z.string().regex(/^[a-z_-]{1,40}$/),
    at: timestamp,
  })).max(2000),
  size: z.strictObject({ size: z.enum(sizes), updatedAt: timestamp }).nullable(),
})

export type SewingState = z.infer<typeof sewingStateSchema>
