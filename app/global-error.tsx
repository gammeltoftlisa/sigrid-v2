'use client'

import { useEffect } from 'react'

/** The last resort, when the root layout itself fails. It replaces the whole document, so it styles itself. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ colorScheme: 'light dark', margin: 0, minHeight: '100svh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <title>Sigrid</title>
        <main>
          <h1 style={{ fontSize: 24, fontWeight: 500 }}>Something went wrong</h1>
          <p>Your saved work is still on this device.</p>
          <button type="button" onClick={() => retry()} style={{ font: 'inherit', padding: '10px 20px', cursor: 'pointer' }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
