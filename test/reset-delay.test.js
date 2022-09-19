import { test } from 'tap'
import Fastify from 'fastify'
import FakeTimers from '@sinonjs/fake-timers'

import slowDownPlugin from '../index.js'
import { slowDownAPI } from './helpers.js'
import { convertToMs } from '../lib/helpers.js'
import { DEFAULT_OPTIONS, HEADERS } from '../lib/constants.js'

test('should reset the delay', async t => {
  const fastify = Fastify()
  const clock = FakeTimers.install()
  await fastify.register(slowDownPlugin)
  t.teardown(() => {
    fastify.close()
    clock.uninstall()
  })

  fastify.get('/', async () => 'Hello from fastify-slow-down!')

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => fastify.inject('/'))

  clock.tick(convertToMs(DEFAULT_OPTIONS.timeWindow))

  const response = await fastify.inject('/')
  t.equal(response.headers[HEADERS.remaining], DEFAULT_OPTIONS.delayAfter - 1)
  t.equal(response.headers[HEADERS.delay], undefined)
})
