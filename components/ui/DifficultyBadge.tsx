import type { Difficulty } from '@/lib/types'

interface Props {
  difficulty: Difficulty
  size?: 'sm' | 'md'
}

const config: Record<Difficulty, { bg: string; text: string; dot: string }> = {
  Beginner: {
    bg: 'bg-success-soft',
    text: 'text-success',
    dot: 'bg-success',
  },
  Intermediate: {
    bg: 'bg-warn-soft',
    text: 'text-warn',
    dot: 'bg-warn',
  },
  Advanced: {
    bg: 'bg-danger-soft',
    text: 'text-danger',
    dot: 'bg-danger',
  },
}

export default function DifficultyBadge({ difficulty, size = 'sm' }: Props) {
  const { bg, text, dot } = config[difficulty]
  const textSize = size === 'sm' ? 'text-[12px]' : 'text-[13px]'
  const padding = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5'

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${bg} ${text} ${textSize} font-semibold ${padding} rounded-full`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {difficulty}
    </span>
  )
}
