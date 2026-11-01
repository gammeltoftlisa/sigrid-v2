import { z } from 'zod'

import { readJson, validEntries, writeRaw } from './local-store'
import { sewingSaved } from './sewing-store'
import type { StepAction } from './types'

/**
 * Every step a user marks done, with when. Saved in the browser like projects are, and on the account when logged in,
 * and used for the dashboard on Home.
 */
export interface StepDone {
  garmentId: string
  /** Index of the step in the garment's guide */
  step: number
  action: StepAction
  /** ISO timestamp */
  at: string
}

const KEY = 'sigrid_activity'

const stepDoneSchema = z.object({
  garmentId: z.string(),
  step: z.number(),
  action: z.custom<StepAction>((a) => typeof a === 'string'),
  at: z.string().refine((s) => !Number.isNaN(Date.parse(s))),
})

export function loadActivity(): StepDone[] {
  const result = readJson(KEY, z.array(z.unknown()))
  return result.status === 'ok' ? validEntries(result.value, stepDoneSchema) : []
}

export function logStepDone(entry: Omit<StepDone, 'at'>) {
  const list = loadActivity().filter((e) => !(e.garmentId === entry.garmentId && e.step === entry.step))
  list.push({ ...entry, at: new Date().toISOString() })
  if (writeRaw(KEY, JSON.stringify(list.slice(-2000))).ok) sewingSaved()
}

/** Local calendar day, e.g. "2026-10-11" */
export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Steps per local day */
export function stepsByDay(list: StepDone[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const e of list) {
    const k = dayKey(new Date(e.at))
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}
