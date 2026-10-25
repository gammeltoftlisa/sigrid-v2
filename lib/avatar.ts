'use client'

import { useSyncExternalStore } from 'react'

/** The profile picture, saved on this device only (there are no accounts in the beta). */
const KEY = 'sigrid_avatar'
const EVENT = 'sigrid-avatar'
/** Saved as a small square: enough for every place it shows, small enough for local storage */
const SIZE = 256
const MAX_UPLOAD = 15 * 1024 * 1024

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** The saved picture as a data URL, or null. Updates everywhere when it changes. */
export function useAvatar() {
  return useSyncExternalStore(subscribe, read, () => null)
}

export function removeAvatar() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
  window.dispatchEvent(new Event(EVENT))
}

/**
 * Crops a photo to a centred square, scales it to 256 px and saves it.
 * Throws a message that can be shown to the user when it can't.
 */
export async function saveAvatarFromFile(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('That file isn’t a photo. Try a JPG, PNG or HEIC.')
  if (file.size > MAX_UPLOAD) throw new Error('That photo is over 15 MB. Try a smaller one.')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This photo couldn’t be opened. Try a JPG or PNG.')
  }
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This photo couldn’t be opened.')
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, SIZE, SIZE)
  bitmap.close()
  const url = canvas.toDataURL('image/jpeg', 0.85)
  try {
    localStorage.setItem(KEY, url)
  } catch {
    throw new Error('There isn’t room to save the photo on this device.')
  }
  window.dispatchEvent(new Event(EVENT))
}
