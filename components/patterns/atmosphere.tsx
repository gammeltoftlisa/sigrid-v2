/**
 * What sits behind the glass: one soft, still light plus a faint grain.
 * Glass has nothing to frost over a completely flat page, so every screen sits on this.
 * Fixed behind everything; hidden with reduced transparency and when printing (global CSS).
 */
export function Atmosphere() {
  return (
    <div aria-hidden className="atmosphere">
      <span className="glow" />
    </div>
  )
}
