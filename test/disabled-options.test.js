import t from 'tap'
import Fastify from 'fastify'

import slowDownPlugin from '../index.js'
import { slowDownAPI } from './helpers.js'
import { HEADERS, DEFAULT_OPTIONS } from '../lib/constants.js'

t.test('should not apply the delay header', async t => {
  t.test('if delay option is 0', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      delay: 0
    })
    t.teardown(() => fastify.close())

    fastify.get('/', async () => 'Hello from fastify-slow-down!')

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => fastify.inject('/'))
    const response = await fastify.inject('/')

    t.equal(response.headers[HEADERS.delay], undefined)
  })

  t.test('if delayAfter option is 0', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      delayAfter: 0
    })
    t.teardown(() => fastify.close())

    fastify.get('/', async () => 'Hello from fastify-slow-down!')

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => fastify.inject('/'))
    const response = await fastify.inject('/')

    t.equal(response.headers[HEADERS.delay], undefined)
  })

  t.test('if timeWindow option is 0', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      timeWindow: 0
    })
    t.teardown(() => fastify.close())

    fastify.get('/', async () => 'Hello from fastify-slow-down!')

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => fastify.inject('/'))
    const response = await fastify.inject('/')

    t.equal(response.headers[HEADERS.delay], undefined)
  })
})
