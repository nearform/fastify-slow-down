import { test } from 'tap'
import Fastify from 'fastify'

import slowDownPlugin from '../index.js'
import { HEADERS } from '../lib/constants.js'
import { internalFetch } from './helpers.js'

test('should work with provided options', async t => {
  const fastify = Fastify()

  await fastify.register(slowDownPlugin, {
    delay: 1000,
    delayAfter: 1,
    timeWindow: '1 minute'
  })
  t.teardown(() => fastify.close())

  fastify.get('/', async () => 'Hello from fastify-slow-down!')
  await fastify.listen()
  const port = fastify.server.address().port
  console.log('port: ', port)

  await internalFetch(port, '/')
  const response = await internalFetch(port, '/')

  t.equal(await response.text(), 'Hello from fastify-slow-down!')
  t.equal(response.status, 200)
  t.equal(response.headers.get([HEADERS.delay]), '1000')
})
