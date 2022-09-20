import t from 'tap'
import Fastify from 'fastify'

import slowDownPlugin from '../index.js'
import { convertToMs } from '../lib/helpers.js'
import { HEADERS, DEFAULT_OPTIONS } from '../lib/constants.js'
import { slowDownAPI } from './helpers.js'

t.test('should delay the API', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  t.teardown(() => fastify.close())

  fastify.get('/', async () => 'Hello from fastify-slow-down!')

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => fastify.inject('/'))

  const delayMs = convertToMs(DEFAULT_OPTIONS.delay)

  let response = await fastify.inject('/')
  t.equal(response.statusCode, 200)
  t.equal(response.headers[HEADERS.delay], delayMs)

  response = await fastify.inject('/')
  t.equal(response.statusCode, 200)
  t.equal(response.headers[HEADERS.delay], 2 * delayMs)

  response = await fastify.inject('/')
  t.equal(response.statusCode, 200)
  t.equal(response.headers[HEADERS.delay], 3 * delayMs)
})
