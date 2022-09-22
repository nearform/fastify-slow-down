import { test } from 'tap'
import Fastify from 'fastify'
import FakeTimers from '@sinonjs/fake-timers'

import slowDownPlugin from '../index.js'
import { internalFetch, slowDownAPI } from './helpers.js'
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
  await fastify.listen()
  const port = fastify.server.address().port

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => internalFetch(port, '/'))

  clock.tick(convertToMs(DEFAULT_OPTIONS.timeWindow))

  const response = await internalFetch(port, '/')

  t.equal(await response.text(), 'Hello from fastify-slow-down!')
  t.equal(
    response.headers.get([HEADERS.remaining]),
    (DEFAULT_OPTIONS.delayAfter - 1).toString()
  )
  t.equal(response.headers.get([HEADERS.delay]), null)
})
