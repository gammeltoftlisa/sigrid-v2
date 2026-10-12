import { bodyDone, pieceSizeDone, type StudioPattern } from './patterns'

/**
 * The maker's path from an empty pattern to one that can be sold: one small
 * job per step. A step counts as done when what it asks for is filled in;
 * looking at a step never changes that.
 */
export type WizardStep = 'basics' | 'describe' | 'sizes' | 'materials' | 'pieces' | 'guide' | 'publish'

export const WIZARD: { id: WizardStep; title: string; short: string; intro: string }[] = [
  { id: 'basics', title: 'Name and price', short: 'Name', intro: 'What the pattern is called and what it costs.' },
  { id: 'describe', title: 'Describe the garment', short: 'Describe', intro: 'A few sentences and the time it takes. This is what sewers read before they buy.' },
  { id: 'sizes', title: 'Sizes', short: 'Sizes', intro: 'Choose the sizes, then check the body measurements each size is made for. Sewers pick their size from this chart.' },
  { id: 'materials', title: 'What sewers need', short: 'Materials', intro: 'The fabric and how much of it for each size, everything else to buy, and the tools.' },
  { id: 'pieces', title: 'Pattern pieces', short: 'Pieces', intro: 'Each piece as a simple outline, with its width and length in every size.' },
  { id: 'guide', title: 'Write the sewing steps', short: 'Steps', intro: 'Write each step right where sewers will read it.' },
  { id: 'publish', title: 'Check and publish', short: 'Publish', intro: 'Look it over as a sewer will see it.' },
]

/** What is still missing in a step, in plain words; empty when the step is done */
export function missingFor(step: WizardStep, p: StudioPattern): string[] {
  const out: string[] = []
  switch (step) {
    case 'basics':
      if (!p.name.trim() || p.name === 'Untitled pattern') out.push('a name')
      if (!p.price) out.push('a price')
      break
    case 'describe':
      if (!p.description.trim()) out.push('a description')
      if (!p.estimatedTime.trim()) out.push('the sewing time')
      break
    case 'sizes':
      if (p.sizes.length === 0) out.push('the sizes')
      else if (p.sizes.some((s) => !bodyDone(p.sizeChart[s]))) out.push('measurements for every size')
      break
    case 'materials':
      if (!p.fabric.name.trim()) out.push('the fabric')
      if (p.sizes.length === 0) out.push('the sizes first')
      else if (p.sizes.some((s) => !p.fabric.metersBySize[s])) out.push('how much fabric for every size')
      break
    case 'pieces':
      if (p.pieces.length === 0) out.push('at least one piece')
      else {
        if (p.pieces.some((x) => !x.name.trim() || x.name === 'New piece')) out.push('a name for every piece')
        if (p.pieces.some((x) => p.sizes.some((s) => !pieceSizeDone(x.bySize[s])))) out.push('the width and length of every piece in every size')
      }
      break
    case 'guide':
      if (p.steps.length === 0) out.push('the steps')
      else if (p.steps.some((s) => !s.title.trim() || s.title === 'New step' || !s.instruction.trim())) out.push('a title and instruction for every step')
      break
    case 'publish':
      break
  }
  return out
}

export const isDone = (step: WizardStep, p: StudioPattern) =>
  step === 'publish' ? p.status === 'ready' : missingFor(step, p).length === 0

/** Where to open a pattern: the first step that isn't done yet */
export const firstOpenStep = (p: StudioPattern): WizardStep => WIZARD.find((s) => !isDone(s.id, p))?.id ?? 'publish'
