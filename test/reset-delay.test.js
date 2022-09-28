import { test } from 'tap'
import Fastify from 'fastify'
import FakeTimers from '@sinonjs/fake-timers'

import slowDownPlugin from '../index.js'
import { internalFetch, slowDownAPI } from './helpers.js'
import { convertToMs } from '../lib/helpers.js'
import { DEFAULT_OPTIONS, HEADERS } from '../lib/constants.js'

const APP_RESPONSE_TEXT = 'Hello from the fastify-slow-down plugin'

async function setup() {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  fastify.get('/', async () => APP_RESPONSE_TEXT)
  return fastify
}

function teardownSetup(t, clock, fastify) {
  t.teardown(() => {
    fastify.close()
    clock.uninstall()
  })
}

test('should reset the delay', async t => {
  const fastify = await setup()
  const clock = FakeTimers.install()
  teardownSetup(t, clock, fastify)
  await fastify.listen()
  const port = fastify.server.address().port

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => internalFetch(port, '/'))

  clock.tick(convertToMs(DEFAULT_OPTIONS.timeWindow))

  const response = await internalFetch(port, '/')

  t.equal(await response.text(), APP_RESPONSE_TEXT)
  t.equal(
    response.headers.get([HEADERS.remaining]),
    (DEFAULT_OPTIONS.delayAfter - 1).toString()
  )
  t.equal(response.headers.get([HEADERS.delay]), null)
})

test('should reset the delay only for a specific request', async t => {
  const fastify = await setup()
  const clock = FakeTimers.install()
  teardownSetup(t, clock, fastify)

  await fastify.listen()
  const port = fastify.server.address().port

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => internalFetch(port, '/'))

  //We're making a request from a different IP address
  let anotherResponse = await fastify.inject({
    path: '/',
    method: 'GET'
  })

  t.equal(anotherResponse.body, APP_RESPONSE_TEXT)
  t.equal(
    anotherResponse.headers[HEADERS.remaining],
    DEFAULT_OPTIONS.delayAfter - 1
  )

  /**
    We want to wait for a half of the time window
    and then make a new request from the same IP address as before
    We want to be sure that this request doesn't affect other ones
  */
  clock.tick(convertToMs(DEFAULT_OPTIONS.timeWindow) / 2)

  anotherResponse = await fastify.inject({
    path: '/',
    method: 'GET'
  })

  t.equal(anotherResponse.body, APP_RESPONSE_TEXT)
  t.equal(
    anotherResponse.headers[HEADERS.remaining],
    DEFAULT_OPTIONS.delayAfter - 2
  )

  /**
   * We want to wait for another half of the time window
   * and then make an additional request that shouldn't be delayed
   * and should contain proper headers
   */
  clock.tick(convertToMs(DEFAULT_OPTIONS.timeWindow) / 2)

  const response = await internalFetch(port, '/')
  t.equal(await response.text(), APP_RESPONSE_TEXT)
  t.equal(
    response.headers.get([HEADERS.remaining]),
    (DEFAULT_OPTIONS.delayAfter - 1).toString()
  )
  t.equal(response.headers.get([HEADERS.delay]), null)

  /**
   * We want to wait for another half of the time window and
   * then a request from the different IP address will have proper headers
   */
  clock.tick(convertToMs(DEFAULT_OPTIONS.timeWindow) / 2)

  anotherResponse = await fastify.inject({
    path: '/',
    method: 'GET'
  })
  t.equal(anotherResponse.body, APP_RESPONSE_TEXT)
  t.equal(
    anotherResponse.headers[HEADERS.remaining],
    DEFAULT_OPTIONS.delayAfter - 1
  )
})
