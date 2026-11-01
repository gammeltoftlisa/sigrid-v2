'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { IconCamera, IconPhotoPlus, IconTrash, IconUser } from '@tabler/icons-react'
import { toast } from 'sonner'
import { cn } from 'cn'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import { CENTERED, drawFramed, frameBounds, openPhoto, removeAvatar, saveAvatar, useAvatar, type PhotoFrame } from '@/lib/avatar'

/** The user's picture, or a quiet person icon. Use it anywhere the profile shows. */
export function UserAvatar({ className }: { className?: string }) {
  const avatar = useAvatar()
  return (
    <Avatar className={className}>
      {avatar && <AvatarImage src={avatar} alt="Your profile picture" />}
      <AvatarFallback className="bg-foreground/7 text-foreground">
        <IconUser className="size-1/2" aria-hidden />
      </AvatarFallback>
    </Avatar>
  )
}

const PREVIEW = 288
const MAX_ZOOM = 4
const clamp = (n: number) => Math.min(1, Math.max(-1, n))

/** Drag the photo to move it, slide to zoom. What's inside the circle is what gets saved. */
function PhotoFramer({ photo, frame, onChange }: { photo: ImageBitmap; frame: PhotoFrame; onChange: (frame: PhotoFrame) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null)

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (ctx) drawFramed(ctx, photo, frame, PREVIEW * 2)
  }, [photo, frame])

  const move = (e: React.PointerEvent) => {
    if (!drag.current || !canvas.current) return
    const { side, roomX, roomY } = frameBounds(photo, frame.zoom)
    // Screen pixels to photo pixels, so the photo follows the pointer exactly
    const scale = side / canvas.current.clientWidth
    onChange({
      ...frame,
      x: roomX ? clamp(drag.current.x - ((e.clientX - drag.current.px) * scale) / roomX) : 0,
      y: roomY ? clamp(drag.current.y - ((e.clientY - drag.current.py) * scale) / roomY) : 0,
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="photo-framer">
        <canvas
          ref={canvas}
          width={PREVIEW * 2}
          height={PREVIEW * 2}
          role="img"
          aria-label="Preview of your profile picture"
          className="size-full touch-none cursor-grab active:cursor-grabbing"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            drag.current = { px: e.clientX, py: e.clientY, x: frame.x, y: frame.y }
          }}
          onPointerMove={move}
          onPointerUp={() => { drag.current = null }}
          onPointerCancel={() => { drag.current = null }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Zoom</Label>
        <Slider
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={[frame.zoom]}
          thumbLabels={['Zoom']}
          onValueChange={(v) => onChange({ ...frame, zoom: Array.isArray(v) ? v[0] : v })}
        />
      </div>
    </div>
  )
}

/**
 * The picture at the top of Profile, round and as wide as its container (on a tablet, where that's the whole page, it stops at 24rem). Pressing the button opens a place to drop a photo, not the file browser;
 * a photo dragged from Finder or Photos can land anywhere on the page. Children sit between the picture and its button.
 */
export function ProfilePhoto({ children }: { children?: React.ReactNode }) {
  const avatar = useAvatar()
  const input = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [photo, setPhoto] = useState<ImageBitmap | null>(null)
  const [frame, setFrame] = useState<PhotoFrame>(CENTERED)

  const take = useCallback(async (file?: File) => {
    if (!file) {
      toast.error('That didn’t come through as a photo. Save it to your Mac first, then drag it in.')
      return
    }
    setOpen(true)
    setBusy(true)
    try {
      const next = await openPhoto(file)
      setPhoto((old) => {
        old?.close()
        return next
      })
      setFrame(CENTERED)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'This photo couldn’t be opened.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }, [])

  // The whole window takes the drop, so a near miss doesn't make the browser open the file instead
  useEffect(() => {
    let depth = 0
    const hasFile = (e: DragEvent) => e.dataTransfer?.types.includes('Files')
    const enter = (e: DragEvent) => {
      if (!hasFile(e)) return
      depth++
      setDragging(true)
    }
    const leave = (e: DragEvent) => {
      if (!hasFile(e)) return
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    const over = (e: DragEvent) => {
      if (!e.dataTransfer?.types.length) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
    const drop = (e: DragEvent) => {
      e.preventDefault()
      depth = 0
      setDragging(false)
      take(e.dataTransfer?.files[0])
    }
    window.addEventListener('dragenter', enter)
    window.addEventListener('dragleave', leave)
    window.addEventListener('dragover', over)
    window.addEventListener('drop', drop)
    return () => {
      window.removeEventListener('dragenter', enter)
      window.removeEventListener('dragleave', leave)
      window.removeEventListener('dragover', over)
      window.removeEventListener('drop', drop)
    }
  }, [take])

  // A photo copied in Photos or a screenshot can be pasted while the dialog is open
  useEffect(() => {
    if (!open) return
    const paste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files[0]
      if (file) take(file)
    }
    window.addEventListener('paste', paste)
    return () => window.removeEventListener('paste', paste)
  }, [open, take])

  const close = () => {
    setOpen(false)
    setPhoto((old) => {
      old?.close()
      return null
    })
  }

  const save = () => {
    if (!photo) return
    try {
      saveAvatar(photo, frame)
      toast.success('Profile picture saved.')
      close()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'This photo couldn’t be saved.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={avatar ? 'Change profile picture' : 'Add a profile picture'}
        className={cn('group/photo relative mx-auto w-full max-w-sm shrink-0 rounded-full', dragging && !open && 'outline-2 outline-offset-4 outline-foreground')}
      >
        <UserAvatar className="aspect-square size-auto w-full [&_svg]:stroke-1 [&_svg]:text-muted-foreground" />
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full bg-foreground/45 text-background opacity-0 transition-opacity group-hover/photo:opacity-100',
            dragging && !open && 'opacity-100',
          )}
        >
          <IconCamera className="size-8" />
        </span>
      </button>
      {children}
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <IconCamera data-icon="inline-start" />
        {avatar ? 'Change photo' : 'Add photo'}
      </Button>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{photo ? 'Frame your photo' : 'Add a profile picture'}</DialogTitle>
            <DialogDescription>
              {photo ? 'Drag the photo to move it. What’s inside the circle is saved.' : 'It’s saved on this device only.'}
            </DialogDescription>
          </DialogHeader>

          {busy ? (
            <div className="photo-drop" role="status">
              <Spinner />
              <p className="text-sm text-muted-foreground">Opening your photo…</p>
            </div>
          ) : photo ? (
            <PhotoFramer photo={photo} frame={frame} onChange={setFrame} />
          ) : (
            <div className="photo-drop" data-dragging={dragging || undefined}>
              <IconPhotoPlus className="size-8 text-muted-foreground" aria-hidden />
              <div className="flex flex-col gap-1">
                <p className="title-sm">Drag a photo here</p>
                <p className="text-xs text-muted-foreground">From Photos, Finder or your desktop. You can also paste one.</p>
              </div>
              <Button variant="outline" onClick={() => input.current?.click()}>Choose a file</Button>
            </div>
          )}

          {photo ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="ghost" onClick={() => input.current?.click()}>Use another photo</Button>
              <Button onClick={save}>Save photo</Button>
            </div>
          ) : avatar && !busy && (
            <Button variant="ghost" className="w-fit" onClick={() => { removeAvatar(); toast('Profile picture removed.'); close() }}>
              <IconTrash data-icon="inline-start" />
              Remove current photo
            </Button>
          )}

          <input
            ref={input}
            type="file"
            accept="image/*,.heic,.heif"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => { if (e.target.files?.[0]) take(e.target.files[0]) }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
