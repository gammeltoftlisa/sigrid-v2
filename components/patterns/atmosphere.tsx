/**
 * What sits behind the glass: a cutting mat lying on the table, over a page of tiny dots.
 * Glass has nothing to frost over a completely flat page, so every screen sits on this.
 * Fixed behind everything; hidden with reduced transparency and when printing (global CSS).
 */

// The mat is the floor: seen by someone very short standing on it, looking far away to the
// right. It's drawn once in true perspective, with a level horizon just above the screen.
// The canvas is cropped to the screen from its top right corner.
const WIDTH = 1600
const HEIGHT = 1000
const HORIZON_Y = -280 // how far above the screen the horizon is: closer flattens the top more
const CENTER_X = 800
const FOCAL = 2500 // higher lays the floor flatter
const TURN = 0.36 // how far the view is turned to the right; the main lines meet at x = 800 + FOCAL * tan(TURN)
const CELL = 0.35 // the size of one square, relative to the eye's height above the floor: higher zooms in
const MAJOR_EVERY = 5 // every fifth line is heavier, as on a real mat

const COS = Math.cos(TURN)
const SIN = Math.sin(TURN)

function project(x: number, z: number) {
  const depth = z * COS - x * SIN
  const screenX = CENTER_X + (FOCAL * (x * COS + z * SIN)) / depth
  const screenY = HORIZON_Y + FOCAL / depth
  return `${screenX.toFixed(1)} ${screenY.toFixed(1)}`
}

function onFloor(screenX: number, screenY: number) {
  const depth = FOCAL / (screenY - HORIZON_Y)
  const side = (depth * (screenX - CENTER_X)) / FOCAL
  return { x: side * COS - depth * SIN, z: side * SIN + depth * COS }
}

function buildMat() {
  const corners = [[0, 0], [WIDTH, 0], [0, HEIGHT], [WIDTH, HEIGHT]].map(([x, y]) => onFloor(x, y))
  const minX = Math.min(...corners.map((c) => c.x))
  const maxX = Math.max(...corners.map((c) => c.x))
  const minZ = Math.min(...corners.map((c) => c.z))
  const maxZ = Math.max(...corners.map((c) => c.z))
  const nearest = FOCAL / (HEIGHT - HORIZON_Y)
  const furthest = FOCAL / -HORIZON_Y

  const minor: string[] = []
  const major: string[] = []
  const add = (index: number, line: string) => (index % MAJOR_EVERY === 0 ? major : minor).push(line)

  // Lines running away from you, towards the top right.
  for (let m = Math.floor(minX / CELL); m <= Math.ceil(maxX / CELL); m++) {
    const x = m * CELL
    const from = Math.max(minZ, (nearest + x * SIN) / COS)
    const to = Math.min(maxZ, (furthest + x * SIN) / COS)
    if (from < to) add(m, `M${project(x, from)}L${project(x, to)}`)
  }

  // Lines running across, closer together the further away they are.
  for (let n = Math.floor(minZ / CELL); n <= Math.ceil(maxZ / CELL); n++) {
    const z = n * CELL
    const from = Math.max(minX, (z * COS - furthest) / SIN)
    const to = Math.min(maxX, (z * COS - nearest) / SIN)
    if (from < to) add(n, `M${project(from, z)}L${project(to, z)}`)
  }

  return { minor: minor.join(''), major: major.join('') }
}

// The dots: a scattered grid rather than noise, so they spread evenly with no clumps and
// the repeating tile can't be seen.
const DOT_TILE = 120
const DOT_SPACING = 6

function buildDots() {
  let seed = 7
  const random = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const dots: string[] = []
  for (let y = 0; y < DOT_TILE; y += DOT_SPACING) {
    for (let x = 0; x < DOT_TILE; x += DOT_SPACING) {
      dots.push(`M${(x + 1 + random() * (DOT_SPACING - 2)).toFixed(1)} ${(y + 1 + random() * (DOT_SPACING - 2)).toFixed(1)}h0`)
    }
  }
  return dots.join('')
}

const MAT = buildMat()
const DOTS = buildDots()

export function Atmosphere() {
  return (
    <div aria-hidden className="atmosphere">
      <svg className="stipple">
        <defs>
          <pattern id="stipple-dots" width={DOT_TILE} height={DOT_TILE} patternUnits="userSpaceOnUse">
            <path d={DOTS} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#stipple-dots)" />
      </svg>
      <svg className="cutting-mat" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMaxYMin slice">
        <path d={MAT.minor} className="cutting-mat-minor" />
        <path d={MAT.major} className="cutting-mat-major" />
      </svg>
    </div>
  )
}
