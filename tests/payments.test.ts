import { readFileSync } from 'node:fs'

import { PGlite } from '@electric-sql/pglite'
import Stripe from 'stripe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: currentUser.id })),
  clerkClient: async () => ({
    users: {
      getUser: async () => ({ primaryEmailAddress: { emailAddress: 'a@test.dev' }, privateMetadata: { stripeCustomerId: 'cus_1' } }),
      updateUserMetadata: async () => {},
    },
  }),
}))
vi.mock('@/lib/payments', () => ({ paymentsEnabled: true }))

const currentUser = vi.hoisted(() => ({ id: 'user_a' as string | null }))

const { POST: webhook } = await import('@/app/api/webhooks/stripe/route')
const { POST: checkout, PATCH: waiver } = await import('@/app/api/checkout/route')
const { GET: confirm } = await import('@/app/api/checkout/confirm/route')
const { GET: guideRoute } = await import('@/app/api/garments/[id]/guide/route')
const { setDbForTests } = await import('@/lib/server/db')
const { hasEntitlement, listPurchases, entitlementStatus } = await import('@/lib/server/entitlements')
const { setStripeForTests } = await import('@/lib/stripe')
const { garments } = await import('@/lib/data')
const { garmentGuides } = await import('@/lib/guides')

const SECRET = 'whsec_test'
const real = new Stripe('sk_test_unused')
const garmentId = garmentGuides.find((g) => garments.some((c) => c.id === g.garmentId))!.garmentId

let pg: PGlite
let fake: {
  webhooks: Stripe['webhooks']
  paymentIntents: { retrieve: ReturnType<typeof vi.fn> }
  checkout: { sessions: { list: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn>; retrieve: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> } }
}

beforeEach(async () => {
  pg = new PGlite()
  await pg.exec(readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'))
  setDbForTests(async (text, params = []) => (await pg.query<Record<string, unknown>>(text, params)).rows)
  fake = {
    webhooks: real.webhooks,
    paymentIntents: { retrieve: vi.fn(async () => ({ metadata: { garmentId, userId: 'user_a' } })) },
    checkout: {
      sessions: {
        list: vi.fn(async () => ({ data: [] })),
        create: vi.fn(async () => ({ id: 'cs_new', client_secret: 'cs_new_secret' })),
        retrieve: vi.fn(),
        update: vi.fn(async () => ({})),
      },
    },
  }
  setStripeForTests(fake as unknown as Stripe)
  vi.stubEnv('STRIPE_WEBHOOK_SECRET', SECRET)
  currentUser.id = 'user_a'
})

afterEach(async () => {
  setDbForTests(null)
  setStripeForTests(null)
  vi.unstubAllEnvs()
  await pg.close()
})

const session = (over: object = {}) => ({
  id: 'cs_1',
  created: 1000,
  status: 'complete',
  payment_status: 'paid',
  payment_intent: 'pi_1',
  metadata: { garmentId, userId: 'user_a', withdrawalWaiver: 'accepted' },
  ...over,
})

let eventCount = 0
function send(type: string, object: object, created: number, id = `evt_${++eventCount}`, secret = SECRET) {
  const payload = JSON.stringify({ id, object: 'event', type, created, data: { object } })
  const signature = real.webhooks.generateTestHeaderString({ payload, secret })
  return webhook(new Request('http://x.test/api/webhooks/stripe', { method: 'POST', body: payload, headers: { 'stripe-signature': signature } }))
}

const paid = (created = 1001, over: object = {}) => send('checkout.session.completed', session(over), created)
const charge = (over: object = {}) => ({ refunded: true, payment_intent: 'pi_1', ...over })
const guideFor = () => guideRoute(new Request(`http://x.test/api/garments/${garmentId}/guide`), { params: Promise.resolve({ id: garmentId }) })
const startCheckout = (body: object = { garmentId }) =>
  checkout(new Request('http://x.test/api/checkout', { method: 'POST', body: JSON.stringify(body) }))
const sendWaiver = (body: object = { sessionId: 'cs_1', acceptWithdrawalWaiver: true }) =>
  waiver(new Request('http://x.test/api/checkout', { method: 'PATCH', body: JSON.stringify(body) }))
const confirmFor = (id = 'cs_1') => confirm(new Request(`http://x.test/api/checkout/confirm?session_id=${id}`))

describe('the webhook', () => {
  it('turns away a forged event', async () => {
    const res = await send('checkout.session.completed', session(), 1001, 'evt_forged', 'whsec_wrong')
    expect(res.status).toBe(400)
    expect(await hasEntitlement('user_a', garmentId)).toBe(false)
  })

  it('a payment unlocks the pattern, once, however many times it arrives', async () => {
    const first = await send('checkout.session.completed', session(), 1001, 'evt_same')
    const again = await send('checkout.session.completed', session(), 1001, 'evt_same')
    expect((await first.json()).repeat).toBeUndefined()
    expect((await again.json()).repeat).toBe(true)
    await paid(1002)
    expect((await pg.query('SELECT 1 FROM entitlements')).rows).toHaveLength(1)
    expect(await listPurchases('user_a')).toEqual([garmentId])
  })

  it('remembers the waiver', async () => {
    await paid()
    const { rows } = await pg.query<{ withdrawal_waiver: boolean }>('SELECT withdrawal_waiver FROM entitlements')
    expect(rows[0].withdrawal_waiver).toBe(true)
  })

  it('a refund arriving before the payment still wins', async () => {
    await send('charge.refunded', charge(), 2000)
    await paid(1001)
    expect(await hasEntitlement('user_a', garmentId)).toBe(false)
  })

  it('a full refund and a dispute take it back; a partial refund does not', async () => {
    await paid()
    await send('charge.refunded', charge({ refunded: false }), 1002)
    expect(await hasEntitlement('user_a', garmentId)).toBe(true)
    await send('charge.dispute.created', { payment_intent: 'pi_1' }, 1003)
    expect(await hasEntitlement('user_a', garmentId)).toBe(false)
    await send('charge.dispute.closed', { payment_intent: 'pi_1', status: 'won' }, 1004)
    expect(await hasEntitlement('user_a', garmentId)).toBe(true)
  })

  it('refunding an old purchase does not touch a newer one', async () => {
    await paid(1001)
    await send('charge.refunded', charge(), 1002)
    await paid(1003, { id: 'cs_2', payment_intent: 'pi_2' })
    await send('charge.refunded', charge(), 1004)
    expect(await hasEntitlement('user_a', garmentId)).toBe(true)
  })

  it('a slow payment method unlocks only when the money arrives', async () => {
    await paid(1001, { payment_status: 'unpaid' })
    expect(await entitlementStatus('user_a', garmentId)).toBe('processing')
    await send('checkout.session.async_payment_succeeded', session(), 1002)
    expect(await hasEntitlement('user_a', garmentId)).toBe(true)
  })

  it('a slow payment that fails unlocks nothing', async () => {
    await paid(1001, { payment_status: 'unpaid' })
    await send('checkout.session.async_payment_failed', session({ payment_status: 'unpaid' }), 1002)
    expect(await hasEntitlement('user_a', garmentId)).toBe(false)
  })

  it('asks Stripe to try again when the database fails, and the retry works', async () => {
    setDbForTests(async () => {
      throw new Error('down')
    })
    const failed = await send('checkout.session.completed', session(), 1001, 'evt_retry')
    expect(failed.status).toBe(500)
    setDbForTests(async (text, params = []) => (await pg.query<Record<string, unknown>>(text, params)).rows)
    const retried = await send('checkout.session.completed', session(), 1001, 'evt_retry')
    expect((await retried.json()).repeat).toBeUndefined()
    expect(await hasEntitlement('user_a', garmentId)).toBe(true)
  })
})

describe('coming back from Stripe', () => {
  it('a real payment unlocks, without waiting for the webhook', async () => {
    fake.checkout.sessions.retrieve.mockResolvedValue(session())
    expect(await (await confirmFor()).json()).toMatchObject({ status: 'active' })
    expect(await hasEntitlement('user_a', garmentId)).toBe(true)
  })

  it("someone else's payment unlocks nothing", async () => {
    fake.checkout.sessions.retrieve.mockResolvedValue(session())
    currentUser.id = 'user_b'
    expect((await confirmFor()).status).toBe(404)
    expect(await hasEntitlement('user_b', garmentId)).toBe(false)
  })

  it('an unpaid or unfinished session unlocks nothing', async () => {
    fake.checkout.sessions.retrieve.mockResolvedValue(session({ status: 'open', payment_status: 'unpaid' }))
    expect(await (await confirmFor()).json()).toMatchObject({ status: 'none' })
    fake.checkout.sessions.retrieve.mockResolvedValue(session({ payment_status: 'unpaid' }))
    expect(await (await confirmFor()).json()).toMatchObject({ status: 'processing' })
  })

  it('a made-up link unlocks nothing, and is not even looked up', async () => {
    expect((await confirmFor('done')).status).toBe(404)
    expect(fake.checkout.sessions.retrieve).not.toHaveBeenCalled()
  })

  it('needs a login', async () => {
    currentUser.id = null
    expect((await confirmFor()).status).toBe(401)
  })

  it('coming back cannot undo a later refund', async () => {
    await paid(1001)
    await send('charge.refunded', charge(), 1002)
    fake.checkout.sessions.retrieve.mockResolvedValue(session({ created: 1000 }))
    expect(await (await confirmFor()).json()).toMatchObject({ status: 'revoked' })
  })
})

describe('starting a checkout', () => {
  it('takes the price from the server, and uses an idempotency key', async () => {
    const res = await startCheckout({ garmentId, price: 1 })
    expect(await res.json()).toEqual({ sessionId: 'cs_new', clientSecret: 'cs_new_secret', email: 'a@test.dev' })
    const [params, options] = fake.checkout.sessions.create.mock.calls[0]
    const price = garments.find((g) => g.id === garmentId)!.price
    expect(params.ui_mode).toBe('elements')
    expect(params.line_items[0].price_data.unit_amount).toBe(price * 100)
    expect(params.payment_intent_data.metadata).toMatchObject({ garmentId, userId: 'user_a' })
    expect(params.metadata.withdrawalWaiver).toBe('pending')
    expect(options.idempotencyKey).toContain(`user_a-${garmentId}-`)
  })

  it('a second tab gets the same open checkout, so it cannot pay twice', async () => {
    fake.checkout.sessions.list.mockResolvedValue({ data: [{ id: 'cs_open', ui_mode: 'elements', client_secret: null, metadata: { garmentId, userId: 'user_a' } }] })
    fake.checkout.sessions.retrieve.mockResolvedValue({ id: 'cs_open', client_secret: 'cs_open_secret' })
    expect(await (await startCheckout()).json()).toMatchObject({ sessionId: 'cs_open', clientSecret: 'cs_open_secret' })
    expect(fake.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('does not sell what is already owned', async () => {
    await paid()
    expect((await startCheckout()).status).toBe(409)
    expect(fake.checkout.sessions.create).not.toHaveBeenCalled()
  })

  it('needs a login', async () => {
    currentUser.id = null
    expect((await startCheckout()).status).toBe(401)
  })
})

describe('pressing Pay', () => {
  it('needs the waiver', async () => {
    expect((await sendWaiver({ sessionId: 'cs_1' })).status).toBe(400)
    expect(fake.checkout.sessions.update).not.toHaveBeenCalled()
  })

  it('marks the waiver on your own open checkout', async () => {
    fake.checkout.sessions.retrieve.mockResolvedValue(session({ status: 'open', metadata: { garmentId, userId: 'user_a', withdrawalWaiver: 'pending' } }))
    expect((await sendWaiver()).status).toBe(200)
    const [id, params] = fake.checkout.sessions.update.mock.calls[0]
    expect(id).toBe('cs_1')
    expect(params.metadata).toMatchObject({ garmentId, userId: 'user_a', withdrawalWaiver: 'accepted' })
  })

  it("cannot mark someone else's checkout", async () => {
    fake.checkout.sessions.retrieve.mockResolvedValue(session({ status: 'open', metadata: { garmentId, userId: 'user_b' } }))
    expect((await sendWaiver()).status).toBe(404)
    expect(fake.checkout.sessions.update).not.toHaveBeenCalled()
  })

  it('needs a login', async () => {
    currentUser.id = null
    expect((await sendWaiver()).status).toBe(401)
  })
})

describe('the guide', () => {
  it('is not sent without a login, or without a purchase', async () => {
    currentUser.id = null
    expect((await guideFor()).status).toBe(401)
    currentUser.id = 'user_a'
    expect((await guideFor()).status).toBe(403)
  })

  it('is sent after a purchase, and stops after a refund', async () => {
    await paid()
    const res = await guideFor()
    expect(res.status).toBe(200)
    expect((await res.json()).steps[0].instruction).toBeTruthy()
    await send('charge.refunded', charge(), 1002)
    expect((await guideFor()).status).toBe(403)
  })

  it('is not sent when ownership cannot be checked', async () => {
    setDbForTests(async () => {
      throw new Error('down')
    })
    expect((await guideFor()).status).toBe(503)
  })
})
