import {
  IconCircleDot,
  IconCut,
  IconFlower,
  IconIroning,
  IconLayersSubtract,
  IconLine,
  IconNeedle,
  IconNeedleThread,
  IconPencil,
  IconPin,
  IconRulerMeasure,
  IconScissors,
  IconShoppingBag,
  IconSparkles,
  IconSquareRounded,
  IconTexture,
  IconTool,
  IconWaveSine,
  IconZip,
  type Icon,
} from '@tabler/icons-react'

import type { Supply } from '@/lib/fabric/supplies'

/** The first that matches wins, so a "zip foot" is a machine part before it's a zip */
const ICONS: [RegExp, Icon][] = [
  [/zip.?foot|machine foot/, IconTool],
  [/needle/, IconNeedle],
  [/thread/, IconNeedleThread],
  [/\bpins?\b/, IconPin],
  [/scissors|shears/, IconScissors],
  [/chalk|marking/, IconPencil],
  [/tape.?measure|ruler/, IconRulerMeasure],
  [/seam.?ripper|unpick/, IconCut],
  [/\biron\b/, IconIroning],
  [/pressing|cloth/, IconTexture],
  [/\bzip\b/, IconZip],
  [/button/, IconCircleDot],
  [/buckle/, IconSquareRounded],
  [/interfacing/, IconLayersSubtract],
  [/lace|fringe/, IconFlower],
  [/sequin/, IconSparkles],
  [/elastic|shirring/, IconWaveSine],
  [/cord|ribbon|tape/, IconLine],
]

/** The picture for something a pattern needs, from what it is. Anything unknown gets a shopping bag. */
export const supplyIcon = (supply: Pick<Supply, 'id' | 'name'>): Icon => {
  const words = `${supply.id} ${supply.name}`.toLowerCase()
  return ICONS.find(([re]) => re.test(words))?.[1] ?? IconShoppingBag
}
