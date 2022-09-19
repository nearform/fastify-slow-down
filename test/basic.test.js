import { test } from 'tap'
import Fastify from 'fastify'

import slowDownPlugin from '../index.js'
import { HEADERS, DEFAULT_OPTIONS } from '../lib/constants.js'

test('should work as a normal API', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  t.teardown(() => fastify.close())

  fastify.get('/', async () => 'Hello from fastify-slow-down!')

  const response = await fastify.inject('/')

  t.equal(response.statusCode, 200)
  t.equal(response.body, 'Hello from fastify-slow-down!')
  t.equal(response.headers[HEADERS.remaining], DEFAULT_OPTIONS.delayAfter - 1)
  t.equal(response.headers[HEADERS.limit], DEFAULT_OPTIONS.delayAfter)
  t.equal(response.headers[HEADERS.delay], undefined)
})
