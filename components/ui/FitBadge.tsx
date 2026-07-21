import type { FitType } from '@/lib/types'

interface Props {
  fit: FitType
  size?: 'sm' | 'md'
}

export default function FitBadge({ fit, size = 'sm' }: Props) {
  const textSize = size === 'sm' ? 'text-[12px]' : 'text-[13px]'
  const padding = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5'

  return (
    <span
      className={`inline-flex items-center ${textSize} font-medium ${padding} rounded-full bg-surface-2 text-ink-2`}
    >
      {fit}
    </span>
  )
}
