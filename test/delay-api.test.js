import t from 'tap'
import Fastify from 'fastify'

import slowDownPlugin from '../index.js'
import { convertToMs } from '../lib/helpers.js'
import { HEADERS, DEFAULT_OPTIONS } from '../lib/constants.js'
import { slowDownAPI } from './helpers.js'

t.test('should delay the API', async t => {
  t.test('using default options', async t => {
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

  t.test(
    'using maxDelay option, the maximum value of delay header should be maxDelay',
    async t => {
      const fastify = Fastify()
      const maxDelay = '3 seconds'
      await fastify.register(slowDownPlugin, { maxDelay })
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

      response = await fastify.inject('/')
      t.equal(response.statusCode, 200)
      t.equal(response.headers[HEADERS.delay], convertToMs(maxDelay))

      response = await fastify.inject('/')
      t.equal(response.statusCode, 200)
      t.equal(response.headers[HEADERS.delay], convertToMs(maxDelay))
    }
  )
})
