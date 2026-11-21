// Run: npm test  (Node's built-in runner, TypeScript via type stripping)
import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker, { type Env } from './index.ts'

const env: Env = { ASSETS: { fetch: async () => new Response('') }, TURNSTILE_SECRET: 's', BOOKING_EMAIL: 'kai@example.com' }
const post = (body: unknown) =>
  new Request('https://kai.test/api/booking-email', { method: 'POST', body: JSON.stringify(body) })

function mockSiteverify(result: object) {
  const calls: FormData[] = []
  globalThis.fetch = (async (_url: string, init: { body: FormData }) => {
    calls.push(init.body)
    return Response.json(result)
  }) as typeof fetch
  return calls
}

test('returns the email after a passed challenge', async () => {
  const calls = mockSiteverify({ success: true, action: 'booking' })
  const res = await worker.fetch(post({ token: 'tok' }), env)
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { email: 'kai@example.com' })
  assert.equal(calls[0].get('secret'), 's')
  assert.equal(calls[0].get('response'), 'tok')
})

test('rejects failed or wrong-action challenges', async () => {
  mockSiteverify({ success: false })
  assert.equal((await worker.fetch(post({ token: 'tok' }), env)).status, 403)
  mockSiteverify({ success: true, action: 'login' })
  assert.equal((await worker.fetch(post({ token: 'tok' }), env)).status, 403)
})

test('rejects bad input without calling siteverify', async () => {
  const calls = mockSiteverify({ success: true })
  assert.equal((await worker.fetch(post({}), env)).status, 400)
  assert.equal((await worker.fetch(post({ token: 'x'.repeat(2049) }), env)).status, 400)
  assert.equal((await worker.fetch(new Request('https://kai.test/api/booking-email'), env)).status, 405)
  assert.equal((await worker.fetch(new Request('https://kai.test/api/nope'), env)).status, 404)
  assert.equal(calls.length, 0)
})
