import Fastify from 'fastify'
import { after, describe, test } from 'node:test'

import slowDownPlugin from '../index.js'
import { DEFAULT_OPTIONS, HEADERS } from '../lib/constants.js'
import { internalFetch, slowDownAPI } from './helpers.js'

describe('should not apply the delay header', async () => {
  test('if the option skip function returns true', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      skip: () => true
    })
    after(() => fastify.close())

    fastify.get('/', async () => 'Hello from fastify-slow-down!')
    await fastify.listen()
    const port = fastify.server.address().port

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
      internalFetch(port, '/')
    )
    const response = await internalFetch(port, '/')

    t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
    t.assert.equal(response.status, 200)
    t.assert.equal(response.headers.get([HEADERS.delay]), null)
  })

  test('if skipSuccessfulRequests is true and the request is a success', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      skipSuccessfulRequests: true
    })
    after(() => fastify.close())

    fastify.get('/', async () => 'Hello from fastify-slow-down!')
    await fastify.listen()
    const port = fastify.server.address().port

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
      internalFetch(port, '/')
    )
    const response = await internalFetch(port, '/')

    t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
    t.assert.equal(response.status, 200)
    t.assert.equal(response.headers.get([HEADERS.delay]), null)
  })

  test('if skipFailedRequests is true and the request fails', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      skipFailedRequests: true
    })
    after(() => fastify.close())

    const test = {
      counter: 0
    }

    fastify.get('/', async () => {
      if (test.counter === DEFAULT_OPTIONS.delayAfter - 1) {
        return 'Hello from fastify-slow-down'
      }
      throw new Error('Request failed')
    })
    await fastify.listen()
    const port = fastify.server.address().port

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, async () => {
      test.counter++
      await internalFetch(port, '/')
    })
    test.counter++
    const response = await internalFetch(port, '/')

    t.assert.equal(response.status, 500)
    t.assert.equal(response.headers.get([HEADERS.delay]), null)
    t.assert.equal(
      parseInt(response.headers.get([HEADERS.remaining])),
      DEFAULT_OPTIONS.delayAfter - 1
    )
  })

  test('if skipSuccessfulRequests is true and the request succeeds and one fail it updates remaining header value properly', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      skipSuccessfulRequests: true
    })
    after(() => fastify.close())
    const test = {
      counter: 0
    }

    fastify.get('/', async () => {
      if (test.counter === DEFAULT_OPTIONS.delayAfter) {
        throw new Error('Request failed')
      }
      return 'Hello from fastify-slow-down!'
    })
    await fastify.listen()
    const port = fastify.server.address().port

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, async () => {
      test.counter++
      await internalFetch(port, '/')
    })
    test.counter++
    const response = await internalFetch(port, '/')

    t.assert.equal(response.status, 200)
    t.assert.equal(response.headers.get([HEADERS.delay]), null)
    t.assert.equal(
      parseInt(response.headers.get([HEADERS.remaining])),
      DEFAULT_OPTIONS.delayAfter - 1
    )
  })
})
