/** Writes lib/studio/examples/saratoga.ts from the pieces and steps below, grading every size from M with the studio's own functions. */
import { writeFileSync } from 'node:fs'
import { gradeFrom, gradePiece, standardBody, withDerived, type StudioPattern, type StudioPiece, type StudioStep } from '../lib/studio/patterns'
import type { JoinKind, StandardSize, StepAction } from '../lib/types'

const sizes: StandardSize[] = ['XS', 'S', 'M', 'L', 'XL']
type L = [label: string, down: number, width: number, curve?: number]
const piece = (n: number, label: string, name: string, quantity: number, onFold: boolean, lines: L[], extra: Partial<StudioPiece> = {}): StudioPiece => {
  const ls = lines.map(([l, , , c], i) => ({ id: `${label.toLowerCase()}${i}`, label: l, curveBelow: c }))
  return {
    id: `piece-${n}`, label, name, shape: 'trapezoid', onFold, quantity, grainLine: 'vertical', seamAllowance: 1.3,
    lines: ls, bySize: { M: Object.fromEntries(ls.map((l, i) => [l.id, { down: lines[i][1], width: lines[i][2] }])) },
    dims: { topWidth: 0, bottomWidth: 0, height: 0 }, ...extra,
  }
}
const pieces: StudioPiece[] = [
  // Lower cape: cut on the fold, so these are half widths; a scooped neckline the collar bends onto
  piece(1, 'A', 'Body (lower cape)', 1, true, [['Neckline', 0, 9], ['Shoulder', 9, 22, 3], ['Hem', 58, 64]], { neckline: 'scoop', necklineDepth: 5 }),
  // Upper cape: two mirrored halves that meet at the centre back
  piece(2, 'B', 'Overlay (upper cape)', 2, false, [['Neckline', 0, 9], ['Shoulder', 8, 20, 2], ['Hem', 32, 40]], { neckline: 'scoop', necklineDepth: 5 }),
  piece(3, 'C', 'Collar', 2, true, [['Outer edge', 0, 11], ['Neck edge', 7, 9.5]]),
  piece(4, 'D', 'Welt', 4, false, [['Top', 0, 20.5], ['Bottom', 6, 20.5]]),
  piece(5, 'E', 'Pocket bag', 4, false, [['Top', 0, 20.5], ['Bottom', 24, 20.5, 2]]),
  piece(6, 'F', 'Welt interfacing', 4, false, [['Top', 0, 20.5], ['Bottom', 6, 20.5]], { material: 'interfacing' }),
  piece(7, 'G', 'Collar interfacing', 1, true, [['Outer edge', 0, 11], ['Neck edge', 7, 9.5]], { material: 'interfacing' }),
]
const base = { sizes, sizeChart: Object.fromEntries(sizes.map((s) => [s, standardBody(s)])) } as unknown as StudioPattern

type S = [title: string, instruction: string, action: StepAction, pieces?: string[], join?: JoinKind, measurement?: string, tip?: string]
const sections: [string, S[]][] = [
  ['Prepare', [
    ['Wash and dry the fabric', 'Wash and tumble dry the twill before you cut anything. It shrinks the first time.', 'prepare', [], undefined, undefined, 'Wash it the way you will wash the finished cape.'],
    ['Plan how to finish the edges', 'The cape has no lining and the twill frays a little. Choose one way to finish the raw edges, like zigzag, an overlocker or bias binding, and finish each seam as you sew it.', 'prepare'],
    ['Cut the fabric pieces', 'Cut A body once on the fold, B overlay twice as a mirrored pair, C collar twice on the fold, D welt four times and E pocket bag as two mirrored pairs.', 'cut', ['piece-1']],
    ['Cut the interfacing', 'Cut F welt interfacing four times and G collar interfacing once on the fold.', 'cut', ['piece-6']],
  ]],
  ['Welt pockets', [
    ['Iron interfacing onto the welts', 'Press a piece of interfacing onto the wrong side of each welt, glue side down.', 'press', ['piece-4', 'piece-6'], 'layer'],
    ['Fold the welts in half', 'Fold each welt in half lengthwise, wrong sides together, and press a sharp fold.', 'press', ['piece-4']],
    ['Mark the pocket openings', 'On the right side of the body front, mark each pocket opening with chalk where the pattern shows it: a box as tall and wide as a folded welt without its seam allowance.', 'mark', ['piece-1'], undefined, '3.2 × 17.8 cm'],
    ['Mark the centre line', 'Draw a chalk line across the middle of each box, from end to end.', 'mark', ['piece-1']],
    ['Pin the welts to the marks', 'Pin two welts to each box, raw edges along the centre line and folds pointing away from it.', 'pin', ['piece-1', 'piece-4'], 'layer'],
    ['Sew the welts on', 'Sew each welt along its top or bottom chalk line, from one end of the box to the other.', 'sew', ['piece-4'], undefined, undefined, 'Start and stop exactly at the box ends; backstitch at both.'],
    ['Cut the pocket opening', 'Cut along the centre line between the welts, stopping short of the ends, then cut small triangles out to the end of each seam.', 'cut', ['piece-1'], undefined, undefined, 'Cut right up to the stitching at the corners, but not through it.'],
    ['Turn the welts inside', 'Push the welts and the triangles through the opening to the wrong side, then press from the outside and the inside.', 'press', ['piece-1']],
  ]],
  ['Pocket bags', [
    ['Pin the first pocket bag', 'Pin the straight side of a pocket bag to the seam allowance of the lower welt. Pin it to the welt only, not to the cape.', 'pin', ['piece-4', 'piece-5'], 'layer'],
    ['Sew the first pocket bag', 'Sew the pocket bag to the welt seam allowance.', 'sew', ['piece-5'], undefined, '6 mm seam'],
    ['Sew the second pocket bag', 'Pin and sew the second pocket bag to the upper welt seam allowance the same way.', 'sew', ['piece-5', 'piece-5#2'], 'layer', '6 mm seam'],
    ['Pin the pocket bags together', 'Lay the two bags on top of each other and pin around the edges. Fold a little of one bag over itself so the edges line up.', 'pin', ['piece-5']],
    ['Sew the triangles to the welts', 'Pin each triangle to the side seam allowance of the welts and sew it. Sew to the welts only, not to the cape.', 'sew', ['piece-4']],
    ['Close the pocket', 'Sew around the edges of the pocket bags to close the pocket.', 'sew', ['piece-5']],
    ['Make the second pocket', 'Repeat the welts and pocket bag steps for the pocket on the other side.', 'sew', ['piece-1']],
  ]],
  ['Front placket', [
    ['Press the first fold', 'Press a fold to the wrong side along both centre front edges.', 'press', ['piece-1'], undefined, '1.3 cm fold'],
    ['Press the placket fold', 'Fold again at the notch at the neckline, so the first fold is hidden inside, and press.', 'press', ['piece-1']],
    ['Topstitch the placket', 'Topstitch along the inner fold from the hem up about three quarters of the way. Leave the top open for now.', 'sew', ['piece-1'], undefined, undefined, 'Don’t sew up to the neckline yet; you finish the top later.'],
  ]],
  ['Back pleat', [
    ['Lay the lower cape flat', 'Lay the lower cape right side up, with the neckline flat.', 'prepare', ['piece-1']],
    ['Fold and pin the pleat', 'Fold the cape right sides together along the centre back and pin the two pleat notches at the neckline together.', 'pin', ['piece-1']],
    ['Sew the pleat', 'Sew down from the neckline through the notches.', 'sew', ['piece-1'], undefined, '5 cm seam'],
    ['Press the box pleat', 'Open the cape out, flatten the pleat so its middle sits on the seam, and press.', 'press', ['piece-1']],
    ['Baste the pleat', 'Baste across the top of the pleat to hold it.', 'sew', ['piece-1'], undefined, '6 mm from the edge'],
  ]],
  ['Back slit', [
    ['Pin the overlay halves', 'Put the two overlay pieces right sides together, centre backs lined up, and pin.', 'pin', ['piece-2', 'piece-2#2'], 'side'],
    ['Sew the centre back', 'Sew from the neckline down to the top of the slit.', 'sew', ['piece-2']],
    ['Press the seam and the slit', 'Press the seam open, then press the slit edges to the wrong side.', 'press', ['piece-2'], undefined, '1.3 cm fold'],
    ['Topstitch the slit', 'Topstitch around the slit, crossing over its top so the seam can’t open.', 'sew', ['piece-2'], undefined, '6 mm from the edge'],
    ['Hem the overlay fronts', 'Press a double fold along the front edges of the overlay and sew over it.', 'sew', ['piece-2'], undefined, '6 mm double fold'],
  ]],
  ['Join the layers', [
    ['Lay the overlay on the body', 'Lay the overlay, wrong side down, on the right side of the lower cape.', 'prepare', ['piece-1', 'piece-2'], 'layer'],
    ['Pin the necklines', 'Line up the shoulders and pin the two necklines together.', 'pin', ['piece-1']],
    ['Sew around the neckline', 'Sew the overlay to the lower cape around the neckline.', 'sew', ['piece-1']],
  ]],
  ['Hems', [
    ['Press both hems', 'Press a fold along the hem of the overlay and of the lower cape.', 'press', ['piece-1'], undefined, '2.5 cm fold'],
    ['Sew the wide hems', 'Sew both hems close to the inner edge of the fold.', 'sew', ['piece-1'], undefined, '2 cm from the edge'],
  ]],
  ['Tack the pockets', [
    ['Lay the pocket bags flat', 'Inside the cape, lay each pocket bag flat, folded toward the front placket.', 'prepare', ['piece-1']],
    ['Tack the corners', 'Hand-sew a few small stitches at the top and bottom corners of each bag to hold it to the inside of the placket.', 'sew', ['piece-1'], undefined, undefined, 'This stops the bags from flapping when the cape is open.'],
  ]],
  ['Finish the placket', [
    ['Refold the placket tops', 'Unfold the top of each placket and fold it back right sides together. Pin across the top.', 'pin', ['piece-1']],
    ['Sew the placket tops', 'Sew across the top of each placket.', 'sew', ['piece-1'], undefined, '1.3 cm seam'],
    ['Turn the plackets', 'Turn the placket tops right side out and push the corners out.', 'press', ['piece-1']],
    ['Finish the topstitching', 'Carry the topstitching on from where you stopped, up to the top of the placket.', 'sew', ['piece-1']],
  ]],
  ['Collar', [
    ['Iron interfacing onto a collar', 'Press the collar interfacing onto the wrong side of one collar piece.', 'press', ['piece-3', 'piece-7'], 'layer'],
    ['Pin the collar pieces', 'Put the two collar pieces right sides together and pin.', 'pin', ['piece-3', 'piece-3#2'], 'layer'],
    ['Sew the collar', 'Sew around the curved top edge and the two sides. Leave the bottom edge open.', 'sew', ['piece-3']],
    ['Clip the corners', 'Clip the seam allowance across the corners, close to the stitching.', 'cut', ['piece-3']],
    ['Turn and press the collar', 'Turn the collar right side out, push the corners out with a point turner and press.', 'press', ['piece-3']],
  ]],
  ['Attach the collar', [
    ['Pin the collar to the neckline', 'Pin the open edge of the collar to the neckline, with the interfaced side against the right side of the cape. The collar curves to follow the neckline.', 'pin', ['piece-1', 'piece-3'], 'top'],
    ['Sew the collar on', 'Sew the collar to the neckline.', 'sew', ['piece-1']],
    ['Understitch the neckline', 'Press the seam allowance down into the cape and understitch it, so it stays inside.', 'sew', ['piece-1']],
  ]],
  ['Buttons', [
    ['Mark the buttonholes', 'With the overlay lying flat over the lower cape, mark six buttonholes on the overlay placket: the first 2 cm from the top, then every 9 cm.', 'mark', ['piece-1'], undefined, '9 cm apart'],
    ['Mark the buttons', 'Mark each button on the other front, right beneath its buttonhole.', 'mark', ['piece-1']],
    ['Sew the buttonholes', 'Sew the buttonholes with the buttonhole foot.', 'sew', ['piece-1'], undefined, undefined, 'Try one on a scrap of the same layers first.'],
    ['Sew on the buttons', 'Sew the buttons on by hand, through the placket and the lower cape.', 'sew', ['piece-1']],
  ]],
]
let n = 0
const steps: StudioStep[] = sections.flatMap(([group, ss]) => ss.map(([title, instruction, action, pcs = [], join, measurement, tip]) => ({
  id: ++n, group, title, instruction, action,
  pieceId: pcs[0]?.split('#')[0], pieceIds: pcs.length > 1 ? pcs : undefined, join, measurement, tip,
} as StudioStep)))

const gradedPieces = pieces.map((p) => gradePiece(base, p, 'M'))
const metersS = 2.75
const pattern = withDerived({
  name: 'Saratoga Cropped Cape Jacket', category: 'Outerwear', difficulty: 'Intermediate',
  description: 'A trench-inspired cropped cape with a poncho silhouette and no separate sleeves. Deep welt pockets, a button placket and a tiered storm capelet with a back slit and box pleat.',
  estimatedTime: '8–10 hours', price: 12, sizes,
  sizeChart: Object.fromEntries(sizes.map((s) => [s, standardBody(s)])),
  fabric: { name: 'Cotton herringbone twill', why: 'Medium weight: it holds the cape shape and presses crisp pleats. Canvas, denim, corduroy or wool suiting also work.', metersBySize: Object.fromEntries(sizes.map((s) => [s, s === 'S' ? metersS : gradeFrom(base, 'S', s).meters(metersS)])) },
  notions: ['8 buttons, 20 mm', 'Thread to match', 'Fusible interfacing, about 0.5 m'],
  tools: ['scissors', 'pins', 'needle', 'iron', 'chalk', 'ruler'],
  seamAllowance: 1.3, pieces: gradedPieces, steps, sectionIcons: {}, messages: [], status: 'ready',
  photo: 'https://blog.moodfabrics.com/wp-content/uploads/2026/10/Herringbone-Twill-Coutil-Fashion-Fabric-Saratoga-Cropped-Cape-Jacket-Model-Photo-H1-768x432.jpg',
  id: 'x', updatedAt: 0,
} as unknown as StudioPattern)
const { id: _id, updatedAt: _u, ...rest } = pattern
void _id; void _u
const header = `/**
 * Mood Fabrics' free Saratoga Cropped Cape Jacket, rebuilt for the studio from the full tutorial
 * (blog.moodfabrics.com/saratoga-cropped-cape-jacket-sewing-pattern): all 7 pieces (with the
 * interfacing), and every action as its own step in Sigrid's words, measurements in cm. Piece
 * sizes are estimates from Sigrid's size chart (the tutorial doesn't list them). Development only:
 * loaded by /studio/example/saratoga. The photo is Mood's; not for publishing.
 * Generated by scripts/saratoga-example.ts (npx tsx scripts/saratoga-example.ts); change that, not this.
 */
import type { StudioPattern } from '../patterns'

export const SARATOGA: Omit<StudioPattern, 'id' | 'updatedAt'> = ${JSON.stringify(rest, null, 2)}
`
writeFileSync('lib/studio/examples/saratoga.ts', header)
console.log('pieces', rest.pieces.length, 'steps', rest.steps.length, 'sizes per piece', rest.pieces.map((p) => Object.keys(p.bySize).length).join(','))
