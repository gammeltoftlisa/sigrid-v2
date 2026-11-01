import { loadActivity, type StepDone } from './activity'
import { sewingReplaced, setSewingSavedHandler } from './sewing-store'
import type { SewingState } from './sewing-types'

/**
 * Keeps the browser's copy of a logged-in user's projects, progress and size in step with their account.
 * Screens keep reading the browser's copy, so everything also works offline and logged out.
 */
const PROJECT_PREFIX = 'sigrid_project_'
const SIZE_KEY = 'sigrid_user_size'
const SIZE_AT_KEY = 'sigrid_user_size_at'
const ACTIVITY_KEY = 'sigrid_activity'
const OWNER_KEY = 'sigrid_sync_owner'
const EPOCH = new Date(0).toISOString()
const DELAY = 1000

function collect(): SewingState {
  const projects: SewingState['projects'] = []
  for (const key of Object.keys(localStorage)) {
    if (!key.startsWith(PROJECT_PREFIX)) continue
    try {
      const p = JSON.parse(localStorage.getItem(key)!)
      // Saved before accounts existed, so it loses to anything already on the account
      projects.push({ garmentId: key.slice(PROJECT_PREFIX.length), size: p.size, completedUntil: p.completedUntil, updatedAt: p.updatedAt ?? EPOCH })
    } catch {}
  }
  const size = localStorage.getItem(SIZE_KEY)
  return {
    projects,
    activity: loadActivity(),
    size: size ? { size: size as NonNullable<SewingState['size']>['size'], updatedAt: localStorage.getItem(SIZE_AT_KEY) ?? EPOCH } : null,
  }
}

function snapshot() {
  const entries = Object.keys(localStorage)
    .filter((k) => k.startsWith(PROJECT_PREFIX) || k === SIZE_KEY || k === ACTIVITY_KEY)
    .sort()
    .map((k) => [k, localStorage.getItem(k)])
  return JSON.stringify(entries)
}

function replaceLocal(state: SewingState) {
  const before = snapshot()
  clearSewing()
  for (const { garmentId, ...project } of state.projects) localStorage.setItem(PROJECT_PREFIX + garmentId, JSON.stringify(project))
  if (state.activity.length > 0) localStorage.setItem(ACTIVITY_KEY, JSON.stringify(state.activity as StepDone[]))
  if (state.size) {
    localStorage.setItem(SIZE_KEY, state.size.size)
    localStorage.setItem(SIZE_AT_KEY, state.size.updatedAt)
  }
  if (snapshot() !== before) sewingReplaced()
}

/** Removes the synced data from this browser. It stays on the account. */
function clearSewing() {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(PROJECT_PREFIX) || key === SIZE_KEY || key === SIZE_AT_KEY || key === ACTIVITY_KEY) localStorage.removeItem(key)
  }
}

let user: string | null = null
let timer: ReturnType<typeof setTimeout> | null = null
let running: Promise<void> | null = null
let saves = 0

async function run() {
  const startedFor = user
  const startedAt = saves
  try {
    const res = await fetch('/api/sewing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collect()),
    })
    // Something saved or changed meanwhile: don't overwrite it, the next run includes it
    if (res.ok && user === startedFor && saves === startedAt) replaceLocal((await res.json()) as SewingState)
  } catch {
    // Offline or the server is down: it stays in the browser and goes up with the next sync
  }
}

function syncNow(): Promise<void> {
  if (timer) { clearTimeout(timer); timer = null }
  if (!user) return Promise.resolve()
  running ??= run().finally(() => {
    running = null
  })
  return running
}

function schedule() {
  saves++
  if (!user) return
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    // A run already under way has the older data, so go again after it
    void (running ?? Promise.resolve()).then(syncNow)
  }, DELAY)
}

const onOnline = () => void syncNow()

/** Call when the login state is known. A browser only ever holds one person's account data. */
export function setSewingUser(userId: string | null) {
  let owner: string | null = null
  try { owner = localStorage.getItem(OWNER_KEY) } catch { return }

  if (!userId) {
    user = null
    setSewingSavedHandler(null)
    window.removeEventListener('online', onOnline)
    if (owner) {
      clearSewing()
      localStorage.removeItem(OWNER_KEY)
      sewingReplaced()
    }
    return
  }

  if (owner && owner !== userId) {
    clearSewing()
    sewingReplaced()
  }
  localStorage.setItem(OWNER_KEY, userId)
  user = userId
  setSewingSavedHandler(schedule)
  window.addEventListener('online', onOnline)
  void syncNow()
}

/** Saves anything waiting before logging out */
export async function flushSewing() {
  await running
  await syncNow()
}

/** Delete my data: the account's copy first, and nothing is deleted locally if that fails */
export async function eraseAccountSewing() {
  if (timer) { clearTimeout(timer); timer = null }
  await running
  const res = await fetch('/api/sewing', { method: 'DELETE' })
  if (!res.ok) throw new Error('Could not delete the data on the account')
  user = null
}
