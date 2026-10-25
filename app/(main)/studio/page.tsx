'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { IconPlus, IconRuler2, IconTrash } from '@tabler/icons-react'
import { toast } from 'sonner'

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
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { PageContainer, PageHeader } from '@/components/patterns/page-header'
import { Panel, PanelRow } from '@/components/patterns/panel'
import { StatusBadge } from '@/components/patterns/status-badge'
import { useMounted } from '@/hooks/use-mounted'
import { createPattern, deletePattern, loadPatterns, plural, type StudioPattern } from '@/lib/studio/patterns'
import { WIZARD, isDone } from '@/lib/studio/wizard'

const updated = (t: number) => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

function DeleteButton({ pattern, onDelete }: { pattern: StudioPattern; onDelete: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="icon-lg" aria-label={`Delete ${pattern.name}`} />}>
        <IconTrash />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {pattern.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Its {pattern.steps.length} steps and {pattern.pieces.length} pieces are deleted from this browser. This can’t be undone.
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

/** The pattern maker's back office: every pattern they are writing or have finished. */
export default function StudioPage() {
  const router = useRouter()
  const mounted = useMounted()
  const [version, setVersion] = useState(0)
  // Re-read after a delete; `version` is what changes
  const patterns = mounted ? loadPatterns() : []
  void version

  const startNew = () => router.push(`/studio/${createPattern().id}`)

  const newButton = (
    <Button size="lg" onClick={startNew}>
      <IconPlus data-icon="inline-start" />
      New pattern
    </Button>
  )

  return (
    <PageContainer>
      <PageHeader
        title="Pattern studio"
        description="Write the sewing guide for your pattern: its pieces, sections and steps, exactly as sewers will follow them."
        breadcrumbs={[{ label: 'Home', href: '/home' }, { label: 'Pattern studio' }]}
        action={patterns.length > 0 ? newButton : undefined}
      />

      {mounted && patterns.length === 0 ? (
        <Empty className="bg-card rounded-(--radius)">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconRuler2 />
            </EmptyMedia>
            <EmptyTitle>No patterns yet</EmptyTitle>
            <EmptyDescription>Start one and write its sewing guide, step by step.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{newButton}</EmptyContent>
        </Empty>
      ) : (
        <Panel label="Your patterns" meta={patterns.length || undefined}>
          {patterns.map((p) => {
            const toFill = WIZARD.filter((w) => w.id !== 'publish')
            const done = toFill.filter((w) => isDone(w.id, p)).length
            return (
              <div key={p.id} className="flex items-center gap-1">
                <PanelRow
                  href={`/studio/${p.id}`}
                  className="flex-1"
                  leading={
                    p.photo ? (
                      <Image src={p.photo} alt="" width={72} height={54} className="aspect-cover w-18 shrink-0 rounded-(--image-radius) object-cover" />
                    ) : undefined
                  }
                  title={p.name}
                  detail={`${plural(p.steps.length, 'step')} · ${plural(p.pieces.length, 'piece')} · edited ${updated(p.updatedAt)}`}
                  meta={
                    <StatusBadge status={p.publishedAt ? 'success' : 'neutral'}>
                      {p.publishedAt ? 'Published' : `Draft · ${done} of ${toFill.length} steps done`}
                    </StatusBadge>
                  }
                />
                <DeleteButton
                  pattern={p}
                  onDelete={() => {
                    deletePattern(p.id)
                    setVersion((v) => v + 1)
                    toast.success(`${p.name} is deleted.`)
                  }}
                />
              </div>
            )
          })}
        </Panel>
      )}
    </PageContainer>
  )
}
