/** An in-memory localStorage with a size limit, so tests can make it run full like a real browser */
export function installFakeStorage(limit = Infinity) {
  const data = new Map<string, string>()
  const size = () => [...data].reduce((n, [k, v]) => n + k.length + v.length, 0)
  const storage = {
    get length() {
      return data.size
    },
    key: (i: number) => [...data.keys()][i] ?? null,
    getItem: (k: string) => data.get(k) ?? null,
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    setItem(k: string, v: string) {
      if (size() - (data.get(k)?.length ?? 0) + (data.has(k) ? 0 : k.length) + v.length > limit) {
        throw Object.assign(new Error('full'), { name: 'QuotaExceededError' })
      }
      data.set(k, v)
    },
  }
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
  return storage
}
