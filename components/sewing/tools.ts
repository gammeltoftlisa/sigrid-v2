import { IconScissors, IconPin, IconNeedleThread, IconIroning, IconPencil, IconRuler2 } from '@tabler/icons-react'
import type { SewingStep2D } from '@/lib/types'

export type Tool = NonNullable<SewingStep2D['tool']>

/** `label` for lists of what you need, `short` for compact chips in the guide. */
export const TOOLS: Record<Tool, { label: string; short: string; Icon: typeof IconScissors }> = {
  scissors: { label: 'Fabric scissors', short: 'Scissors', Icon: IconScissors },
  pins:     { label: 'Pins',            short: 'Pins',     Icon: IconPin },
  needle:   { label: 'Sewing machine',  short: 'Machine',  Icon: IconNeedleThread },
  iron:     { label: 'Iron',            short: 'Iron',     Icon: IconIroning },
  chalk:    { label: 'Tailor’s chalk',  short: 'Chalk',    Icon: IconPencil },
  ruler:    { label: 'Ruler',           short: 'Ruler',    Icon: IconRuler2 },
}
