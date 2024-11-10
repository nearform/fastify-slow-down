import Fastify from 'fastify'
import { after, test } from 'node:test'

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
  after(() => fastify.close())

  fastify.get('/', async () => 'Hello from fastify-slow-down!')
  await fastify.listen()
  const port = fastify.server.address().port

  await internalFetch(port, '/')
  const response = await internalFetch(port, '/')

  t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
  t.assert.equal(response.status, 200)
  t.assert.equal(response.headers.get([HEADERS.delay]), '1000')
})
