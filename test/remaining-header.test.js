import { test } from 'tap'
import Fastify from 'fastify'

import slowDownPlugin from '../index.js'
import { HEADERS, DEFAULT_OPTIONS } from '../lib/constants.js'

test('should decrement the remaining header', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  t.teardown(() => fastify.close())

  fastify.get('/', async () => 'Hello from fastify-slow-down!')

  for (let i = 1; i <= DEFAULT_OPTIONS.delayAfter; i++) {
    const response = await fastify.inject('/')
    t.equal(response.headers[HEADERS.remaining], DEFAULT_OPTIONS.delayAfter - i)
    t.equal(response.headers[HEADERS.delay], undefined)
  }
})
