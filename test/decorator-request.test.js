import Fastify from 'fastify'
import { after, describe, test } from 'node:test'

import slowDownPlugin from '../index.js'
import { DEFAULT_OPTIONS } from '../lib/constants.js'
import { convertToMs } from '../lib/helpers.js'
import { internalFetch, slowDownAPI } from './helpers.js'

describe('should contain the slowDown request decorator', async () => {
  test('without delay property', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin)
    after(() => fastify.close())

    fastify.get('/', async req => req.slowDown)
    await fastify.listen()
    const port = fastify.server.address().port

    const responseBody = await (await internalFetch(port, '/')).json()

    t.assert.assert.equal(responseBody.limit, DEFAULT_OPTIONS.delayAfter)
    t.assert.assert.equal(responseBody.current, 1)
    t.assert.assert.equal(responseBody.remaining, DEFAULT_OPTIONS.delayAfter - 1)
    t.assert.assert.equal(responseBody.delay, undefined)
  })

  test('with delay property', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin)
    after(() => fastify.close())

    fastify.get('/', async req => req.slowDown)
    await fastify.listen()
    const port = fastify.server.address().port

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
      internalFetch(port, '/')
    )
    const responseBody = await (await internalFetch(port, '/')).json()

    t.assert.assert.equal(responseBody.limit, DEFAULT_OPTIONS.delayAfter)
    t.assert.assert.equal(responseBody.current, 1)
    t.assert.assert.equal(responseBody.remaining, DEFAULT_OPTIONS.delayAfter - 1)
    t.assert.assert.equal(responseBody.delay, convertToMs(DEFAULT_OPTIONS.delay))
  })
})
