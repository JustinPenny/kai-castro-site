// Cloudflare Worker: only /api/* reaches this (see run_worker_first in
// wrangler.jsonc); every other path is served from ./dist as static assets.

export interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> }
  TURNSTILE_SECRET: string
  BOOKING_EMAIL: string
}

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    if (url.pathname !== '/api/booking-email') return json({ error: 'not found' }, 404)
    if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

    const body: { token?: unknown } = await req.json().catch(() => ({}))
    const token = body.token
    // Turnstile tokens are at most 2048 chars.
    if (typeof token !== 'string' || !token || token.length > 2048) return json({ error: 'bad token' }, 400)

    const form = new FormData()
    form.append('secret', env.TURNSTILE_SECRET)
    form.append('response', token)
    const ip = req.headers.get('CF-Connecting-IP')
    if (ip) form.append('remoteip', ip)

    let outcome: { success?: boolean; action?: string }
    try {
      const res = await fetch(SITEVERIFY, { method: 'POST', body: form })
      outcome = await res.json()
    } catch {
      return json({ error: 'verification unavailable' }, 502)
    }
    // Real tokens carry the widget's action; Cloudflare's test secret omits it.
    if (!outcome.success || (outcome.action !== undefined && outcome.action !== 'booking')) {
      return json({ error: 'verification failed' }, 403)
    }
    return json({ email: env.BOOKING_EMAIL })
  },
}
