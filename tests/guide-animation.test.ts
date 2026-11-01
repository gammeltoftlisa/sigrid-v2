import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { buildStepScene, cutLine } from '@/lib/guide-animation/scenes'
import { stateAt } from '@/lib/guide-scene'
import { cutMode, foldWidths, planStep, quantityOf, stitchOf } from '@/lib/guide-animation/rules'
import { garmentGuides } from '@/lib/guides'
import { standardSizes } from '@/lib/data'
import type { SewingStep2D } from '@/lib/types'

const step = (over: Partial<SewingStep2D>): SewingStep2D => ({ id: 1, group: 'g', action: 'sew', title: 't', instruction: '', ...over })
const guide = (id: string) => garmentGuides.find((g) => g.garmentId === id)!
const planFor = (id: string, title: string) => {
  const g = guide(id)
  const i = g.steps.findIndex((s) => s.title === title)
  return planStep(g.steps[i], i, g.steps, g.pieces)
}

describe('cutting', () => {
  it('on the fold when the words or the piece say so', () => {
    expect(cutMode(step({ instruction: 'with its centre on the fold of the fabric' }), undefined)).toBe('fold')
    expect(cutMode(step({}), { id: 'a', label: 'A', shape: 'rectangle', dims: { topWidth: 1, bottomWidth: 1, height: 1 }, outline: { lines: [], onFold: true } })).toBe('fold')
  })
  it('two loose pieces when it goes through both layers', () => {
    expect(cutMode(step({ instruction: 'cut through both layers' }), undefined)).toBe('pair')
    expect(cutMode(step({}), { id: 'a', label: 'A', name: 'Front (cut 2)', shape: 'rectangle', dims: { topWidth: 1, bottomWidth: 1, height: 1 } })).toBe('pair')
  })
  it('one layer otherwise', () => expect(cutMode(step({ instruction: 'Cut along your chalk lines' }), undefined)).toBe('single'))
  it('counts the pieces', () => expect(quantityOf({ id: 'a', label: 'A', name: 'Sleeve (cut 2)', shape: 'rectangle', dims: { topWidth: 1, bottomWidth: 1, height: 1 } }, step({}))).toBe(2))
  it('reads the real guides', () => {
    expect(planFor('cap-sleeve-button-top', 'Cut the two fronts')).toMatchObject({ kind: 'cut', mode: 'pair', quantity: 2 })
    expect(planFor('cap-sleeve-button-top', 'Cut the back')).toMatchObject({ kind: 'cut', mode: 'fold', quantity: 1 })
  })
  it('a mark step before a cut draws the line, and the cut step cuts it', () => {
    expect(planFor('lace-waist-skirt', 'Mark the skirt front')).toMatchObject({ kind: 'cut', only: 'draw' })
    expect(planFor('lace-waist-skirt', 'Cut the skirt front')).toMatchObject({ kind: 'cut', only: 'cut' })
  })
})

describe('the cut line, with the pattern exactly in the corner', () => {
  const W = 60
  it('in the far corner: the top and side are the fabric\'s own edges, so only the rest is cut', () => {
    // a 20 x 6 rectangle in the top right corner
    const loop: [number, number][] = [[40, 0], [60, 0], [60, 6], [40, 6], [40, 0]]
    expect(cutLine(loop, 'pair', W)).toEqual([[60, 6], [40, 6], [40, 0]])
  })
  it('in the near corner of one layer: the same', () => {
    const loop: [number, number][] = [[0, 0], [20, 0], [20, 6], [0, 6], [0, 0]]
    expect(cutLine(loop, 'single', W)).toEqual([[20, 0], [20, 6], [0, 6]])
  })
  it('on the fold: not the fold, and not the top edge when it lies on the fabric\'s edge', () => {
    const loop: [number, number][] = [[0, 0], [20, 0], [20, 6], [0, 6], [0, 0]]
    expect(cutLine(loop, 'fold', W)).toEqual([[20, 0], [20, 6], [0, 6]])
  })
  it('a shape that only touches at its corners is cut right round', () => {
    const loop: [number, number][] = [[30, 0], [45, 8], [60, 10], [30, 10], [30, 0]]
    expect(cutLine(loop, 'pair', W)).toEqual([[30, 0], [45, 8], [60, 10], [30, 10], [30, 0]])
  })
})

describe('folding', () => {
  it('once or twice, from the measurement', () => {
    expect(foldWidths(step({ annotation: { type: 'fold-line', label: '0.5 + 1 cm' } }))).toEqual([0.5, 1])
    expect(foldWidths(step({ measurement: '6 mm double fold' }))).toEqual([0.6, 0.6])
    expect(foldWidths(step({ measurement: '1.3 cm fold' }))).toEqual([1.3])
    expect(foldWidths(step({ annotation: { type: 'fold-line', amount: 2 } }))).toEqual([2])
  })
  it('reads the real guides', () => {
    expect(planFor('cap-sleeve-button-top', 'Fold the sleeve hems')).toMatchObject({ kind: 'fold', edges: ['bottom'], widths: [0.5, 1], press: true, pin: true })
    expect(planFor('lace-waist-skirt', 'Fold the band in half')).toMatchObject({ kind: 'fold', widths: [] })
  })
  it('pressing a fold in is folding, pressing a seam is ironing', () => {
    expect(planStep(step({ action: 'press', title: 'Press the first fold', measurement: '1.3 cm fold', instruction: 'along both centre front edges' }), 0, [], [])).toMatchObject({ kind: 'fold', edges: ['right', 'left'] })
    expect(planStep(step({ action: 'press', title: 'Press the left seam open' }), 0, [], [])).toMatchObject({ kind: 'press' })
  })
})

describe('sewing', () => {
  it('picks the stitch from the words', () => {
    expect(stitchOf(step({ title: 'Baste the loops' }))).toBe('baste')
    expect(stitchOf(step({ instruction: 'Sew with your longest stitch' }))).toBe('baste')
    expect(stitchOf(step({ title: 'Topstitch the placket' }))).toBe('top')
    expect(stitchOf(step({ title: 'Sew the buttonholes' }))).toBe('satin')
    expect(stitchOf(step({ instruction: 'finish it with zigzag' }))).toBe('zigzag')
    expect(stitchOf(step({ instruction: 'by hand with small slip stitches' }))).toBe('tack')
    expect(stitchOf(step({ title: 'Sew the side seams' }))).toBe('stitch')
  })
  it('buttons are counted and sewn by hand', () => expect(planFor('cap-sleeve-button-top', 'Sew on the buttons')).toMatchObject({ kind: 'buttons', count: 4 }))
  it('slip stitching is by hand', () => expect(planFor('lace-waist-skirt', 'Stitch the band closed')).toMatchObject({ kind: 'sew', hand: true }))
})

describe('every step of every real guide', () => {
  for (const g of garmentGuides) {
    it(`${g.garmentId} has a scene for each step that can show one`, () => {
      g.steps.forEach((s, i) => {
        const plan = planStep(s, i, g.steps, g.pieces)
        if (plan.kind === 'none') return
        const scene = buildStepScene(g.steps, i, g.pieces, standardSizes.M)
        expect(scene, s.title).not.toBeNull()
        expect(scene!.total, s.title).toBeGreaterThan(0)
        // Every moment can be worked out, from the first to the result
        for (let k = 0; k <= 12; k++) expect(() => stateAt(scene!, (scene!.total * k) / 12), s.title).not.toThrow()
      })
    })
  }
  it('what a step folded is still there in the next step', () => {
    const g = guide('cap-sleeve-button-top')
    const sewHem = g.steps.findIndex((s) => s.title === 'Sew the sleeve hems')
    const scene = buildStepScene(g.steps, sewHem, g.pieces, standardSizes.M)!
    const first = stateAt(scene, 0)
    expect(first.p.sleeve.bands?.length).toBe(2)
  })
})
