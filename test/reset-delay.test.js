import FakeTimers from '@sinonjs/fake-timers'
import Fastify from 'fastify'
import { test } from 'node:test'

import slowDownPlugin from '../index.js'
import { DEFAULT_OPTIONS, HEADERS } from '../lib/constants.js'
import { convertToMs } from '../lib/helpers.js'
import { internalFetch, slowDownAPI } from './helpers.js'

const APP_RESPONSE_TEXT = 'Hello from the fastify-slow-down plugin'

function setup() {
  const fastify = Fastify()
  fastify.register(slowDownPlugin)
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
  const fastify = setup()
  const clock = FakeTimers.install()
  teardownSetup(t, clock, fastify)
  await fastify.listen()
  const port = fastify.server.address().port

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => internalFetch(port, '/'))

  clock.tick(convertToMs(DEFAULT_OPTIONS.timeWindow))

  const response = await internalFetch(port, '/')

  t.assert.equal(await response.text(), APP_RESPONSE_TEXT)
  t.assert.equal(
    response.headers.get([HEADERS.remaining]),
    String(DEFAULT_OPTIONS.delayAfter - 1)
  )
  t.assert.equal(response.headers.get([HEADERS.delay]), null)
})

test('should reset the delay only for a specific request', async t => {
  const fastify = setup()
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

  t.assert.equal(anotherResponse.body, APP_RESPONSE_TEXT)
  t.assert.equal(
    anotherResponse.headers[HEADERS.remaining],
    String(DEFAULT_OPTIONS.delayAfter - 1)
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

  t.assert.equal(anotherResponse.body, APP_RESPONSE_TEXT)
  t.assert.equal(
    anotherResponse.headers[HEADERS.remaining],
    String(DEFAULT_OPTIONS.delayAfter - 2)
  )

  /**
   * We want to wait for another half of the time window
   * and then make an additional request that shouldn't be delayed
   * and should contain proper headers
   */
  clock.tick(convertToMs(DEFAULT_OPTIONS.timeWindow) / 2)

  const response = await internalFetch(port, '/')
  t.assert.equal(await response.text(), APP_RESPONSE_TEXT)
  t.assert.equal(
    response.headers.get([HEADERS.remaining]),
    String(DEFAULT_OPTIONS.delayAfter - 1)
  )
  t.assert.equal(response.headers.get([HEADERS.delay]), null)

  /**
   * We want to wait for another half of the time window and
   * then a request from the different IP address will have proper headers
   */
  clock.tick(convertToMs(DEFAULT_OPTIONS.timeWindow) / 2)

  anotherResponse = await fastify.inject({
    path: '/',
    method: 'GET'
  })
  t.assert.equal(anotherResponse.body, APP_RESPONSE_TEXT)
  t.assert.equal(
    anotherResponse.headers[HEADERS.remaining],
    String(DEFAULT_OPTIONS.delayAfter - 1)
  )
})
