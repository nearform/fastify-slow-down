import { test } from 'tap'
import Fastify from 'fastify'

import slowDownPlugin from '../index.js'
import { HEADERS } from '../lib/constants.js'

test('should work with provided options', async t => {
  const fastify = Fastify()

  await fastify.register(slowDownPlugin, {
    delay: 1000,
    delayAfter: 1,
    timeWindow: '1 minute'
  })
  t.teardown(() => fastify.close())

  fastify.get('/', async () => 'Hello from fastify-slow-down!')

  await fastify.inject('/')
  const response = await fastify.inject('/')

  t.equal(response.statusCode, 200)
  t.equal(response.headers[HEADERS.delay], 1000)
})
