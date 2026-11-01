/** Runs at most `max` tasks at a time; the others wait their turn, first come, first served. */
export function createLimiter(max: number) {
  let running = 0
  const waiting: (() => void)[] = []

  return async function limit<T>(task: () => Promise<T>): Promise<T> {
    if (running >= max) await new Promise<void>((resolve) => waiting.push(resolve))
    running++
    try {
      return await task()
    } finally {
      running--
      waiting.shift()?.()
    }
  }
}
