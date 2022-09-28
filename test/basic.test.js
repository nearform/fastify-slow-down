import { test } from 'tap'
import Fastify from 'fastify'

import slowDownPlugin from '../index.js'
import { HEADERS, DEFAULT_OPTIONS } from '../lib/constants.js'
import { internalFetch } from './helpers.js'

test('should work as a normal API', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  t.teardown(() => fastify.close())

  fastify.get('/', async () => 'Hello from fastify-slow-down!')
  await fastify.listen()
  const port = fastify.server.address().port
  console.log('port: ', port)

  const response = await internalFetch(port, '/')

  t.equal(await response.text(), 'Hello from fastify-slow-down!')
  t.equal(response.status, 200)
  t.equal(
    response.headers.get([HEADERS.remaining]),
    (DEFAULT_OPTIONS.delayAfter - 1).toString()
  )
  t.equal(
    response.headers.get([HEADERS.limit]),
    DEFAULT_OPTIONS.delayAfter.toString()
  )
  t.equal(response.headers.get([HEADERS.delay]), null)
})
