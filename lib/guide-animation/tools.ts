/**
 * The guide's tools, drawn once in centimetres at real size, as seen from straight above like the
 * rest of the scene. Colours come from classes (t-steel, t-ink ...), so a look only changes the CSS.
 * Every tool points +x with its working point at the origin, except the machine (see below).
 */
export type ToolKind = 'machine' | 'hand' | 'iron' | 'scissors' | 'chalk'

const r = (n: number) => n.toFixed(2)

/** Tailor's shears: long blades, a small thumb bow and a long finger bow. The origin is where the blades cross the cut. */
export function shears(phase: number) {
  const f = phase % 1
  const open = ((1 - Math.cos(f * Math.PI * 2)) / 2) * 8 + 1
  const finger = 'M.2,-.42 C-2,-.28 -3.7,.22 -5.7,.92 C-8.6,.56 -12.6,.86 -15.2,2.1 C-17.3,3.12 -17.5,5.05 -15.3,5.95 C-12,7.1 -7.5,6.7 -5.1,4.95 C-3.7,3.85 -2.5,2.35 -1.1,.95 L.2,.42 Z M-6.3,2.05 C-8.7,1.72 -12.1,1.95 -14.2,2.95 C-15.8,3.68 -15.8,4.72 -14.4,5.16 C-11.7,5.98 -8.3,5.56 -6.5,4.24 C-5.5,3.44 -5.3,2.28 -6.3,2.05 Z'
  const thumb = 'M.2,.42 C-1.8,.28 -3,-.08 -4.6,-.72 C-6.7,-.5 -9.7,-.82 -11.5,-2.02 C-13.1,-3.06 -13.1,-4.66 -11.5,-5.36 C-9,-6.26 -5.5,-5.66 -3.8,-4.02 C-2.8,-3.02 -1.9,-1.92 -.9,-.92 L.2,-.42 Z M-5.25,-1.92 C-7.05,-1.72 -9.45,-2.12 -10.75,-3.02 C-11.85,-3.74 -11.65,-4.44 -10.65,-4.74 C-8.85,-5.34 -6.2,-4.84 -4.98,-3.64 C-4.28,-2.94 -4.38,-2.02 -5.25,-1.92 Z'
  const upper = `<g transform="rotate(${r(-open)})">
    <path class="t-ink" fill-rule="evenodd" d="${finger}"/>
    <path class="t-stitch" d="M-5.9,1.46 C-8.6,1.14 -12.4,1.4 -14.7,2.5 C-16.6,3.4 -16.6,4.9 -14.8,5.55 C-11.8,6.55 -7.9,6.15 -5.75,4.62"/>
    <path class="t-gleam" d="M-2.2,.32 C-3.4,.5 -4.5,.86 -5.6,1.16"/>
    <path class="t-blade" d="M-1.8,-1 C2.4,-1.78 9.6,-1.68 15.6,-.1 L15.6,0 L-1.8,.24 Z"/>
    <path class="t-bevel" d="M-1.2,-.36 L14.9,-.12 L15.6,0 L-1.2,.2 Z"/>
    <path class="t-hl" d="M-1,-.9 C3,-1.52 9.4,-1.42 14.4,-.36 C9.4,-1.24 3,-1.28 -1,-.74 Z"/>
    <path class="t-seam" d="M-1,-.42 L14.4,-.16"/>
  </g>`
  const lower = `<g transform="rotate(${r(open)})">
    <path class="t-ink" fill-rule="evenodd" d="${thumb}"/>
    <path class="t-stitch" d="M-4.9,-1.32 C-6.9,-1.1 -9.6,-1.46 -11.1,-2.5 C-12.5,-3.4 -12.4,-4.5 -11,-5 C-8.9,-5.8 -5.8,-5.26 -4.4,-3.8"/>
    <path class="t-gleam" d="M-2,-.36 C-3,-.5 -3.8,-.74 -4.6,-1.02"/>
    <path class="t-blade" d="M-1.8,1 C2.4,1.82 9.6,1.8 14.8,.62 Q15.6,.3 15.1,.02 L-1.8,-.24 Z"/>
    <path class="t-bevel" d="M-1.2,.36 L14.7,.18 L15.1,.02 L-1.2,-.2 Z"/>
    <path class="t-seam" d="M-1,.42 L14.2,.22"/>
  </g>`
  return `<g transform="translate(-3.4,0)">${upper}${lower}
    <circle class="t-steel2" r=".72"/><circle class="t-screw" r=".54"/><path class="t-slot" d="M-.34,-.2 L.34,.2"/></g>`
}

/** An iron from above, tip +x. The origin is the middle of the soleplate. */
export function iron(phase: number) {
  const puff = (i: number) => {
    const ph = (phase + i * 0.33) % 1
    return `<circle class="t-steam" cx="${r(12.8 + ph * 4.4)}" cy="${r((i - 1) * 1.9 * (0.5 + ph))}" r="${r(0.8 + ph * 1.9)}" opacity="${r(0.85 * Math.sin(Math.PI * ph))}"/>`
  }
  const sole = 'M12.5,0 C9.5,-3.8 3,-5.7 -6.2,-5.8 Q-10.6,-5.8 -10.6,-3.6 L-10.6,3.6 Q-10.6,5.8 -6.2,5.8 C3,5.7 9.5,3.8 12.5,0 Z'
  const body = 'M11,0 C8.3,-3.1 2.6,-4.92 -5.9,-5.02 Q-9.9,-5.02 -9.9,-3.1 L-9.9,3.1 Q-9.9,5.02 -5.9,5.02 C2.6,4.92 8.3,3.1 11,0 Z'
  return `<g>
    ${[0, 1, 2].map(puff).join('')}
    <path class="t-sole" d="${sole}"/>
    <path class="t-ink" d="${body}"/>
    <path class="t-sheen" d="M10,-.3 C7.6,-2.8 2.4,-4.5 -5.6,-4.62 C-8.2,-4.62 -9.2,-4 -9.3,-2.8 C-7,-3.7 -1.5,-3.9 2.6,-3 C5.8,-2.4 8.2,-1.4 10,-.3 Z"/>
    <path class="t-stitch" d="M8.9,0 C6.6,-2.4 2,-4.1 -5.7,-4.24 Q-9,-4.24 -9,-2.8 L-9,2.8 Q-9,4.24 -5.7,4.24 C2,4.1 6.6,2.4 8.9,0 Z"/>
    <path class="t-handle" d="M-8.4,-1.4 Q-8.4,-2.1 -7.7,-2.1 H2.2 Q4.5,-2.1 4.5,0 Q4.5,2.1 2.2,2.1 H-7.7 Q-8.4,2.1 -8.4,1.4 Z"/>
    <path class="t-hl" d="M-7.8,-1.74 H2.2 Q3.6,-1.74 4,-.8 Q3.4,-1.36 2.2,-1.36 H-7.8 Z"/>
    <rect class="t-recess" x="-6.2" y="-.66" width="8.8" height="1.32" rx=".66"/>
    <circle class="t-steel2" cx="7" r="1.22"/><circle class="t-screw" cx="7" r=".98"/>
    <rect class="t-ink2" x="6.84" y="-.84" width=".32" height=".72" rx=".14"/>
    <circle class="t-recess" cx="10" cy="-.32" r=".13"/><circle class="t-recess" cx="10" cy=".32" r=".13"/>
  </g>`
}

/** Tailor's chalk, a rounded triangle with its tip on the line */
export function chalk() {
  return `<g transform="rotate(-38)">
    <path class="t-bone" d="M0,0 Q-.5,-.34 -1.05,-.6 L-4.6,-2.5 Q-5.9,-3.05 -6.2,-2.1 L-6.9,.9 Q-7.1,1.9 -6.1,1.9 L-1.1,.56 Q-.4,.36 0,0 Z"/>
    <path class="t-bone2" d="M-.5,.05 L-6.5,.72 L-6.9,.9 Q-7.1,1.9 -6.1,1.9 L-1.1,.56 Q-.4,.36 0,0 Z"/>
    <path class="t-hl" d="M-1.5,-.62 L-4.6,-2.26 Q-5.6,-2.7 -5.9,-1.9 Q-5.4,-2.3 -4.6,-1.94 L-1.5,-.5 Z"/>
    <path class="t-seam" d="M-.5,.05 L-6.5,.72"/>
  </g>
  <circle class="t-dust" cx="-1" cy="-.7" r=".09"/><circle class="t-dust" cx="-1.7" cy=".6" r=".07"/><circle class="t-dust" cx="-2.5" cy="-.3" r=".06"/>`
}

/** A hand needle lying on the cloth, its point on the seam, the thread trailing from the eye */
export function needle(phase: number) {
  const pull = (Math.cos(phase * Math.PI * 2) + 1) / 2
  return `<g transform="translate(${r(-pull * 1.2)},0)">
    <path class="t-thread-s" d="M-5.2,0 C-7.4,.2 -8.2,2 -9.8,2.3 S-13,1.6 -14.5,2.9"/>
    <path class="t-steel" d="M-5.5,-.11 Q-5.8,0 -5.5,.11 L-.7,.07 L0,0 L-.7,-.07 Z"/>
    <ellipse class="t-ink" cx="-5.15" rx=".24" ry=".035"/>
  </g>`
}

/**
 * A sewing machine from the front, standing over the seam with the needle tip at the origin. The
 * head is on the left, the arm goes across and the pillar comes down on the right.
 */
export function machineFront(phase: number) {
  const down = (Math.cos(phase * Math.PI * 2) + 1) / 2
  const up = (1 - down) * 1.5
  const lever = -16.4
  const wraps = [-27.2, -26.6, -26, -25.4].map((y) => `<path class="t-wrap" d="M18.7,${y} L21.3,${r(y - 0.25)}"/>`).join('')
  return `<g>
    <ellipse class="t-light" cx=".3" cy="-.05" rx="2.5" ry=".62"/>
    <rect class="t-ink" x="31" y="-23.6" width="2.5" height="7" rx="1"/>
    <path class="t-rib" d="M31.8,-23.6 V-16.6 M32.6,-23.6 V-16.6" stroke-width=".12"/>
    <path class="t-body" d="M-3.6,-6.2 V-20.2 Q-3.6,-24.6 .8,-24.6 H26 Q31.6,-24.6 31.6,-19 V-.6 Q31.6,0 31,0 H24.4 Q23.8,0 23.8,-.6 V-14.2 Q23.8,-16.9 21.1,-16.9 H6.2 Q3.6,-16.9 3.6,-14.2 V-6.2 Q3.6,-4.7 2.1,-4.7 H-2.1 Q-3.6,-4.7 -3.6,-6.2 Z"/>
    <path class="t-under" d="M23.8,-.6 V-14.2 Q23.8,-16.9 21.1,-16.9 H6.2 Q3.6,-16.9 3.6,-14.2 V-13.2 Q3.6,-15.5 6.2,-15.5 H21.6 Q25.3,-15.5 25.3,-11.8 V0 H24.4 Q23.8,0 23.8,-.6 Z"/>
    <path class="t-hl" d="M-2.9,-20.4 Q-2.9,-23.9 .8,-23.9 H26 Q29.8,-23.9 30.6,-20.6 Q29.4,-23.3 26,-23.3 H.8 Q-2.3,-23.3 -2.9,-20.4 Z"/>
    <path class="t-stitch-d" d="M5.6,-17.9 H21.4 Q24.8,-17.9 24.8,-14.4 V-1"/>
    <path class="t-stitch-d" d="M30.4,-1 V-19 Q30.4,-22.6 26.6,-22.6 H19"/>
    <rect class="t-lcd" x="7.4" y="-22.6" width="11" height="3.5" rx=".8"/>
    <path class="t-lcd-line" d="M8.6,-20.9 H13"/>
    <circle class="t-screen" cx="15" cy="-20.85" r=".34"/><circle class="t-screen" cx="16.8" cy="-20.85" r=".34"/>
    <circle class="t-steel2" cx="27.5" cy="-20.4" r="1.85"/><circle class="t-screw" cx="27.5" cy="-20.4" r="1.42"/><rect class="t-ink2" x="27.32" y="-21.6" width=".36" height="1.05" rx=".12"/>
    <line class="t-steel-s" x1="20" y1="-24.6" x2="20" y2="-29.2" stroke-width=".2"/>
    <path class="t-spool" d="M18.5,-24.9 V-27.6 Q18.5,-28 18.9,-28 H21.1 Q21.5,-28 21.5,-27.6 V-24.9 Z"/>
    ${wraps}
    <rect class="t-steel" x="18" y="-28.3" width="4" height=".42" rx=".14"/><rect class="t-steel" x="18" y="-25.05" width="4" height=".42" rx=".14"/>
    <path class="t-seam" d="M-3.6,-9.8 H3.6"/>
    <rect class="t-recess" x="-2.5" y="-20.8" width="1.08" height="9" rx=".54"/>
    <circle class="t-screw" cx="-1.96" cy="${r(lever)}" r=".58"/>
    <circle class="t-steel2" cx="1.3" cy="-21.3" r="1.32"/><circle class="t-screw" cx="1.3" cy="-21.3" r="1"/><rect class="t-ink2" x="1.15" y="-22.1" width=".3" height=".78" rx=".1"/>
    <rect class="t-steel2" x="-2.7" y="-6" width="5.4" height=".6" rx=".22"/>
    <rect class="t-steel" x=".55" y="-4.7" width=".4" height="3.9"/>
    <rect class="t-steel" x="-.21" y="-4.7" width=".42" height="${r(2.1 - up)}"/>
    <rect class="t-steel2" x="-.44" y="${r(-2.85 - up)}" width=".88" height=".44" rx=".08"/>
    <line class="t-steel-s" x1="0" y1="${r(-2.45 - up)}" x2="0" y2="${r(-up)}" stroke-width=".14" stroke-linecap="round"/>
    <path class="t-steel" d="M-1.2,-.52 H2.1 Q3,-.52 3,-.1 V0 H-1.6 Q-1.6,-.42 -1.2,-.52 Z"/>
  </g>`
}

/** What's under the fabric: the machine's bed. The cloth passes over it, between it and the head */
export function machineFrontBed() {
  return `<g><rect class="t-bed" x="-13.6" y="-.4" width="51" height="4.4" rx="1.5"/><rect class="t-steel" x="-3.6" y="-.4" width="7.2" height="1.1" rx=".24"/><path class="t-stitch-d" d="M-12.4,2.6 H36"/></g>`
}

/** How wide each tool really is, cm, and what share of the stage's short side it takes up */
export const TOOL_SIZE: Record<string, { cm: number; share: number }> = {
  scissors: { cm: 33, share: 0.46 },
  iron: { cm: 23, share: 0.35 },
  chalk: { cm: 7, share: 0.13 },
  hand: { cm: 6, share: 0.14 },
  machine: { cm: 44, share: 0.72 },
}

export function toolMarkup(kind: ToolKind, phase: number) {
  if (kind === 'scissors') return shears(phase)
  if (kind === 'iron') return iron(phase)
  if (kind === 'chalk') return chalk()
  if (kind === 'hand') return needle(phase)
  return machineFront(phase)
}

/** The tools' materials, lit from the top left. Referenced by the classes in globals.css. */
export const TOOL_GRADIENTS = `<linearGradient id="tg-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EDEFF0"/><stop offset=".46" stop-color="#C0C4C8"/><stop offset=".56" stop-color="#A4A9AE"/><stop offset="1" stop-color="#858B91"/></linearGradient>
  <linearGradient id="tg-steel2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A5AAAF"/><stop offset="1" stop-color="#6C7278"/></linearGradient>
  <radialGradient id="tg-screw" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#FAFBFB"/><stop offset=".55" stop-color="#C4C8CB"/><stop offset="1" stop-color="#8A9095"/></radialGradient>
  <linearGradient id="tg-blade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7DADC"/><stop offset=".5" stop-color="#ABB0B4"/><stop offset="1" stop-color="#8D9297"/></linearGradient>
  <linearGradient id="tg-bevel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#CDD0D3"/><stop offset=".4" stop-color="#F8F9F9"/><stop offset=".7" stop-color="#DDE0E2"/><stop offset="1" stop-color="#FFFFFF"/></linearGradient>
  <linearGradient id="tg-sole" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F5F6"/><stop offset=".42" stop-color="#BDC1C5"/><stop offset=".6" stop-color="#E2E4E6"/><stop offset="1" stop-color="#868C92"/></linearGradient>
  <linearGradient id="tg-ink" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3D3731"/><stop offset=".4" stop-color="#1D1A16"/><stop offset="1" stop-color="#0E0C0A"/></linearGradient>
  <linearGradient id="tg-ink2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4C463E"/><stop offset="1" stop-color="#26221D"/></linearGradient>
  <linearGradient id="tg-handle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A534A"/><stop offset=".5" stop-color="#34302A"/><stop offset="1" stop-color="#1E1B17"/></linearGradient>
  <linearGradient id="tg-recess" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0B0A08"/><stop offset="1" stop-color="#26221D"/></linearGradient>
  <linearGradient id="tg-spool" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#17140F"/><stop offset=".35" stop-color="#4A443C"/><stop offset="1" stop-color="#15120F"/></linearGradient>
  <linearGradient id="tg-lcd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2C2823"/><stop offset="1" stop-color="#110F0C"/></linearGradient>
  <linearGradient id="tg-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFEFC"/><stop offset=".62" stop-color="#F6F2EB"/><stop offset="1" stop-color="#E4DED3"/></linearGradient>
  <linearGradient id="tg-under" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BDB6A9"/><stop offset=".25" stop-color="#D9D3C7"/><stop offset="1" stop-color="#E7E2D7"/></linearGradient>
  <linearGradient id="tg-bed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2EEE6"/><stop offset="1" stop-color="#CFC8BB"/></linearGradient>
  <linearGradient id="tg-bone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFEFB"/><stop offset=".65" stop-color="#F2EDE3"/><stop offset="1" stop-color="#DAD3C5"/></linearGradient>
  <linearGradient id="tg-bone2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9E3D8"/><stop offset="1" stop-color="#C8C0B1"/></linearGradient>
  <radialGradient id="tg-ball" cx=".36" cy=".3" r=".78"><stop offset="0" stop-color="#6E675E"/><stop offset=".4" stop-color="#26211C"/><stop offset="1" stop-color="#0B0A08"/></radialGradient>
  <radialGradient id="tg-steam"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".6" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`
