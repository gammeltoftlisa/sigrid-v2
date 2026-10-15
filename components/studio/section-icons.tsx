import {
  IconArrowsJoin,
  IconBrush,
  IconCircleCheck,
  IconDroplet,
  IconFold,
  IconHanger,
  IconIroning,
  IconLayersIntersect,
  IconNeedle,
  IconNeedleThread,
  IconPaperclip,
  IconPencil,
  IconPin,
  IconRuler2,
  IconScissors,
  IconShirt,
  IconStar,
  IconTag,
  IconWashMachine,
  type Icon,
} from '@tabler/icons-react'

import type { Section, StudioStep } from '@/lib/studio/patterns'

/** The icons a section can have; the key is what gets saved */
export const SECTION_ICONS = {
  droplet: { Icon: IconDroplet, label: 'Water drop' },
  wash: { Icon: IconWashMachine, label: 'Washing' },
  scissors: { Icon: IconScissors, label: 'Scissors' },
  pencil: { Icon: IconPencil, label: 'Chalk' },
  ruler: { Icon: IconRuler2, label: 'Ruler' },
  pin: { Icon: IconPin, label: 'Pin' },
  clip: { Icon: IconPaperclip, label: 'Clip' },
  machine: { Icon: IconNeedleThread, label: 'Sewing machine' },
  needle: { Icon: IconNeedle, label: 'Hand needle' },
  join: { Icon: IconArrowsJoin, label: 'Join' },
  layers: { Icon: IconLayersIntersect, label: 'Layers' },
  fold: { Icon: IconFold, label: 'Fold' },
  iron: { Icon: IconIroning, label: 'Iron' },
  shirt: { Icon: IconShirt, label: 'Garment' },
  hanger: { Icon: IconHanger, label: 'Hanger' },
  tag: { Icon: IconTag, label: 'Label' },
  brush: { Icon: IconBrush, label: 'Details' },
  star: { Icon: IconStar, label: 'Star' },
  check: { Icon: IconCircleCheck, label: 'Done' },
} satisfies Record<string, { Icon: Icon; label: string }>

export type SectionIconKey = keyof typeof SECTION_ICONS

/** Ready-made sections: one click sets both the title and the icon */
export const SECTION_PRESETS: { title: string; icon: SectionIconKey }[] = [
  { title: 'Prepare', icon: 'droplet' },
  { title: 'Cut the pieces', icon: 'scissors' },
  { title: 'Mark', icon: 'pencil' },
  { title: 'Pin and baste', icon: 'pin' },
  { title: 'Sew the seams', icon: 'machine' },
  { title: 'Attach', icon: 'join' },
  { title: 'Press', icon: 'iron' },
  { title: 'Hem', icon: 'ruler' },
  { title: 'Finish', icon: 'hanger' },
]

/** The icon a section shows: the one chosen, else a guess from its steps (as the sewer's guide does) */
export function sectionIconKey(section: Section, steps: StudioStep[], chosen?: Record<string, string>): SectionIconKey {
  const picked = chosen?.[section.group]
  if (picked && picked in SECTION_ICONS) return picked as SectionIconKey
  const preset = SECTION_PRESETS.find((p) => p.title.toLowerCase() === section.group.toLowerCase())
  if (preset) return preset.icon
  const actions = section.indices.map((i) => steps[i].action)
  if (actions.includes('cut')) return 'scissors'
  if (actions.every((a) => a === 'prepare')) return 'droplet'
  if (/finish|hem/i.test(section.group)) return 'iron'
  return 'machine'
}
