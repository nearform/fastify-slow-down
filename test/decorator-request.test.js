import { test } from 'tap'
import Fastify from 'fastify'

import slowDownPlugin from '../index.js'
import { DEFAULT_OPTIONS } from '../lib/constants.js'
import { internalFetch, slowDownAPI } from './helpers.js'
import { convertToMs } from '../lib/helpers.js'

test('should contain the slowDown request decorator', async t => {
  t.test('without delay property', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin)
    t.teardown(() => fastify.close())

    fastify.get('/', async req => req.slowDown)
    await fastify.listen()
    const port = fastify.server.address().port

    const responseBody = await (await internalFetch(port, '/')).json()

    t.has(responseBody, {
      limit: DEFAULT_OPTIONS.delayAfter,
      current: 1,
      remaining: DEFAULT_OPTIONS.delayAfter - 1,
      delay: undefined
    })
  })

  t.test('with delay property', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin)
    t.teardown(() => fastify.close())

    fastify.get('/', async req => req.slowDown)
    await fastify.listen()
    const port = fastify.server.address().port

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
      internalFetch(port, '/')
    )
    const responseBody = await (await internalFetch(port, '/')).json()

    t.has(responseBody, {
      limit: DEFAULT_OPTIONS.delayAfter,
      current: DEFAULT_OPTIONS.delayAfter + 1,
      remaining: 0,
      delay: convertToMs(DEFAULT_OPTIONS.delay)
    })
  })
})
