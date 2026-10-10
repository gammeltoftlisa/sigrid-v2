import { Badge } from '@/components/ui/badge'
import type { Difficulty } from '@/lib/types'

const level: Record<Difficulty, number> = { Beginner: 1, Intermediate: 2, Advanced: 3 }

/**
 * Difficulty as metadata, not status: neutral outline badge with a 3-step meter
 * so it reads at a glance without relying on colour.
 */
export function DifficultyBadge({ difficulty, className }: { difficulty: Difficulty; className?: string }) {
  return (
    <Badge variant="outline" className={className}>
      <span aria-hidden className="flex items-end gap-px">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`w-0.5 rounded-full ${n <= level[difficulty] ? 'bg-foreground' : 'bg-border'}`}
            style={{ height: 4 + n * 2 }}
          />
        ))}
      </span>
      {difficulty}
    </Badge>
  )
}
