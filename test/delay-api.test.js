import Fastify from 'fastify'
import { describe, test } from 'node:test'

import slowDownPlugin from '../index.js'
import { DEFAULT_OPTIONS, HEADERS } from '../lib/constants.js'
import { convertToMs } from '../lib/helpers.js'
import { internalFetch, slowDownAPI } from './helpers.js'

describe('should delay the API', () => {
  test('using default options', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin)
    after(() => fastify.close())

    fastify.get('/', async () => 'Hello from fastify-slow-down!')
    await fastify.listen()
    const port = fastify.server.address().port

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
      internalFetch(port, '/')
    )

    const delayMs = convertToMs(DEFAULT_OPTIONS.delay)

    let response = await internalFetch(port, '/')
    t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
    t.assert.equal(response.status, 200)
    t.assert.equal(response.headers.get([HEADERS.delay]), delayMs.toString())

    response = await internalFetch(port, '/')
    t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
    t.assert.equal(response.status, 200)
    t.assert.equal(response.headers.get([HEADERS.delay]), (2 * delayMs).toString())
  })

  test(
    'using maxDelay option, the maximum value of delay header should be maxDelay',
    async t => {
      const fastify = Fastify()
      const maxDelay = '2 seconds'
      await fastify.register(slowDownPlugin, { maxDelay })
      after(() => fastify.close())

      fastify.get('/', async () => 'Hello from fastify-slow-down!')
      await fastify.listen()
      const port = fastify.server.address().port

      await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
        internalFetch(port, '/')
      )

      const delayMs = convertToMs(DEFAULT_OPTIONS.delay)

      let response = await internalFetch(port, '/')
      t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
      t.assert.equal(response.status, 200)
      t.assert.equal(response.headers.get([HEADERS.delay]), delayMs.toString())

      response = await internalFetch(port, '/')
      t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
      t.assert.equal(response.status, 200)
      t.assert.equal(response.headers.get([HEADERS.delay]), (2 * delayMs).toString())

      response = await internalFetch(port, '/')
      t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
      t.assert.equal(response.status, 200)
      t.assert.equal(
        response.headers.get([HEADERS.delay]),
        convertToMs(maxDelay).toString()
      )

      response = await internalFetch(port, '/')
      t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
      t.assert.equal(response.status, 200)
      t.assert.equal(
        response.headers.get([HEADERS.delay]),
        convertToMs(maxDelay).toString()
      )
    }
  )
})
