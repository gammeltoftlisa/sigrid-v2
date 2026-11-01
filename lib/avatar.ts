'use client'

import { useSyncExternalStore } from 'react'

/** The profile picture, saved on this device only. */
const KEY = 'sigrid_avatar'
const EVENT = 'sigrid-avatar'
/** Saved as a square: sharp at the full width of Profile's side panel, small enough for local storage */
const SIZE = 768
const MAX_UPLOAD = 30 * 1024 * 1024

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

const isHeic = (file: File) => /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name)
const isImage = (file: File) => file.type.startsWith('image/') || isHeic(file)

/**
 * Opens a photo so it can be framed. Throws a message that can be shown to the user when it can't.
 * iPhone photos are HEIC, which only Safari can open by itself, so the converter loads only when one arrives.
 */
export async function openPhoto(file: File): Promise<ImageBitmap> {
  if (!isImage(file)) throw new Error('That file isn’t a photo. Try a JPG, PNG or HEIC.')
  if (file.size > MAX_UPLOAD) throw new Error('That photo is over 30 MB. Try a smaller one.')
  try {
    return await createImageBitmap(file)
  } catch {
    if (!isHeic(file)) throw new Error('This photo couldn’t be opened. Try a JPG or PNG.')
  }
  try {
    const { heicTo } = await import('heic-to/csp')
    return await createImageBitmap(await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 }))
  } catch {
    throw new Error('This photo couldn’t be opened. Try a JPG or PNG.')
  }
}

/** How a photo sits in the square: zoom 1 fills it, and x and y (−1 to 1) move across what's left over. */
export interface PhotoFrame {
  zoom: number
  x: number
  y: number
}

export const CENTERED: PhotoFrame = { zoom: 1, x: 0, y: 0 }

/** The part of the photo that shows: its side length, and how far it can move from the centre on each axis */
export function frameBounds(photo: { width: number; height: number }, zoom: number) {
  const side = Math.min(photo.width, photo.height) / zoom
  return { side, roomX: (photo.width - side) / 2, roomY: (photo.height - side) / 2 }
}

export function drawFramed(ctx: CanvasRenderingContext2D, photo: ImageBitmap, frame: PhotoFrame, size: number) {
  const { side, roomX, roomY } = frameBounds(photo, frame.zoom)
  ctx.drawImage(photo, roomX + frame.x * roomX, roomY + frame.y * roomY, side, side, 0, 0, size, size)
}

/** Saves the framed photo as the profile picture. Throws a message that can be shown to the user when it can't. */
export function saveAvatar(photo: ImageBitmap, frame: PhotoFrame) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This photo couldn’t be saved.')
  drawFramed(ctx, photo, frame, SIZE)
  try {
    localStorage.setItem(KEY, canvas.toDataURL('image/jpeg', 0.85))
  } catch {
    throw new Error('There isn’t room to save the photo on this device.')
  }
  window.dispatchEvent(new Event(EVENT))
}
