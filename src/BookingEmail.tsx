import { useEffect, useRef, useState } from 'react'

// shortcut: falls back to Cloudflare's always-pass test site key; set
// VITE_TURNSTILE_SITE_KEY at build time for production.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'

interface Turnstile {
  render(el: HTMLElement, opts: Record<string, unknown>): string
  remove(id: string): void
}
declare global {
  interface Window {
    turnstile?: Turnstile
  }
}

let loading: Promise<Turnstile> | undefined
function loadTurnstile() {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile missing')))
    s.onerror = () => {
      loading = undefined
      reject(new Error('turnstile failed to load'))
    }
    document.head.append(s)
  })
  return loading
}

// The booking address is only fetched from the Worker after a passed
// Turnstile challenge, so scrapers never see it in the page.
export default function BookingEmail() {
  const box = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let widget: string | undefined
    loadTurnstile()
      .then((ts) => {
        if (cancelled || !box.current) return
        widget = ts.render(box.current, {
          sitekey: SITE_KEY,
          action: 'booking',
          size: 'compact',
          theme: 'light',
          callback: async (token: string) => {
            try {
              const res = await fetch('/api/booking-email', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ token }),
              })
              if (!res.ok) throw new Error(String(res.status))
              const data: { email: string } = await res.json()
              if (!cancelled) setEmail(data.email)
            } catch {
              if (!cancelled) setFailed(true)
            }
          },
          'error-callback': () => setFailed(true),
        })
      })
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
      if (widget) window.turnstile?.remove(widget)
    }
  }, [])

  if (email) return <a href={`mailto:${email}`}>{email}</a>
  if (failed) return <p className="panel-status">Couldn't load -- DM @kaicastromusic</p>
  return <div ref={box} className="turnstile" />
}
