import Fastify from 'fastify'
import { after, test } from 'node:test'

import slowDownPlugin from '../index.js'
import { DEFAULT_OPTIONS, HEADERS } from '../lib/constants.js'
import { internalFetch } from './helpers.js'

test('should decrement the remaining header', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  after(() => fastify.close())

  fastify.get('/', async () => 'Hello from fastify-slow-down!')
  await fastify.listen()
  const port = fastify.server.address().port

  for (let i = 1; i <= DEFAULT_OPTIONS.delayAfter; i++) {
    const response = await internalFetch(port, '/')

    t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
    t.assert.equal(response.status, 200)
    t.assert.equal(
      response.headers.get([HEADERS.remaining]),
      (DEFAULT_OPTIONS.delayAfter - i).toString()
    )
    t.assert.equal(response.headers.get([HEADERS.delay]), null)
  }
})
