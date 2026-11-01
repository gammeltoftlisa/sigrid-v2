'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react'
import { RULES, type Scene } from '@/lib/guide-scene'
import { FlatSceneView } from '@/lib/guide-animation/flat-view'

/**
 * A step played out like an instruction video: the pieces flat on the net, in one plain fabric, with
 * the tools doing the step. Loops on its own; reduced motion shows the finished frame. Drawn straight
 * into the DOM each frame, outside React.
 */
export default function GuideScene({ scene, label }: { scene: Scene; label: string }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const view = new FlatSceneView(el, scene, `gs${uid}`)
    let time = reduce ? scene.total : 0
    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min(64, now - last)
      last = now
      if (!reduce && !pausedRef.current) {
        time += dt
        if (time >= scene.total + RULES.hold) time = 0
      }
      view.render(Math.min(time, scene.total))
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const ro = new ResizeObserver(() => view.build())
    ro.observe(el)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      view.destroy()
    }
  }, [scene, reduce, uid])

  return (
    <div className="guide-scene relative h-full w-full overflow-hidden">
      <div ref={stageRef} className="gs-stage absolute inset-0" role="img" aria-label={label} />
      {!reduce && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Play' : 'Pause'}
          className="glass-chip absolute right-3 bottom-3 flex size-8 items-center justify-center rounded-full"
        >
          {paused ? <IconPlayerPlayFilled size={14} /> : <IconPlayerPauseFilled size={14} />}
        </button>
      )}
    </div>
  )
}
