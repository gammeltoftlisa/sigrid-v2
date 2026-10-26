/**
 * A garment photo for a studio pattern, shrunk to at most 1200 px on its long side and saved as
 * a JPEG data URL, so it fits in this browser's storage alongside the pattern.
 */
export async function photoFromFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file isn’t a photo. Try a JPG, PNG or HEIC.')
  if (file.size > 25 * 1024 * 1024) throw new Error('That photo is over 25 MB. Try a smaller one.')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('This photo couldn’t be opened. Try a JPG or PNG.')
  }
  const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}
