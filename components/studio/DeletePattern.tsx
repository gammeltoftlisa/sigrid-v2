'use client'

import { IconTrash } from '@tabler/icons-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import type { StudioPattern } from '@/lib/studio/patterns'

/** Deleting a pattern, from its own page: a quiet icon button, then a dialog that says what goes */
export function DeletePattern({ pattern, onDelete }: { pattern: StudioPattern; onDelete: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon" aria-label={`Delete ${pattern.name}`} title="Delete pattern" />}>
        <IconTrash />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {pattern.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Its {pattern.steps.length} steps, {pattern.pieces.length} pieces and photos are deleted from this browser{pattern.publishedAt ? ', and it leaves Explore' : ''}. This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDelete}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
