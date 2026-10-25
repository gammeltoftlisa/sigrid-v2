'use client'

import { useRef, useState } from 'react'
import { IconCamera, IconTrash, IconUser } from '@tabler/icons-react'
import { toast } from 'sonner'
import { cn } from 'cn'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { removeAvatar, saveAvatarFromFile, useAvatar } from '@/lib/avatar'

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

/** Upload, change or remove the profile picture. Saved on this device only. */
export function ProfilePhoto() {
  const avatar = useAvatar()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      await saveAvatarFromFile(file)
      toast.success('Profile picture saved.')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'This photo couldn’t be saved.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4 px-1">
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={avatar ? 'Change profile picture' : 'Upload a profile picture'}
        className="group/photo relative shrink-0 rounded-full"
      >
        <UserAvatar className="size-20" />
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full bg-foreground/45 text-background opacity-0 transition-opacity group-hover/photo:opacity-100',
            busy && 'opacity-100',
          )}
        >
          {busy ? <Spinner /> : <IconCamera className="size-6" />}
        </span>
      </button>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
            <IconCamera data-icon="inline-start" />
            {avatar ? 'Change photo' : 'Upload photo'}
          </Button>
          {avatar && (
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => { removeAvatar(); toast('Profile picture removed.') }}>
              <IconTrash data-icon="inline-start" />
              Remove
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Saved on this device only.</p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => pick(e.target.files?.[0])}
      />
    </div>
  )
}
