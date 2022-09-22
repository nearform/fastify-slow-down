import t from 'tap'
import Fastify from 'fastify'

import slowDownPlugin from '../index.js'
import { convertToMs } from '../lib/helpers.js'
import { HEADERS, DEFAULT_OPTIONS } from '../lib/constants.js'
import { internalFetch, slowDownAPI } from './helpers.js'

t.test('should delay the API', async t => {
  t.test('using default options', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin)
    t.teardown(() => fastify.close())

    fastify.get('/', async () => 'Hello from fastify-slow-down!')
    await fastify.listen()
    const port = fastify.server.address().port

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
      internalFetch(port, '/')
    )

    const delayMs = convertToMs(DEFAULT_OPTIONS.delay)

    let response = await internalFetch(port, '/')
    t.equal(await response.text(), 'Hello from fastify-slow-down!')
    t.equal(response.status, 200)
    t.equal(response.headers.get([HEADERS.delay]), delayMs.toString())

    response = await internalFetch(port, '/')
    t.equal(await response.text(), 'Hello from fastify-slow-down!')
    t.equal(response.status, 200)
    t.equal(response.headers.get([HEADERS.delay]), (2 * delayMs).toString())
  })

  t.test(
    'using maxDelay option, the maximum value of delay header should be maxDelay',
    async t => {
      const fastify = Fastify()
      const maxDelay = '2 seconds'
      await fastify.register(slowDownPlugin, { maxDelay })
      t.teardown(() => fastify.close())

      fastify.get('/', async () => 'Hello from fastify-slow-down!')
      await fastify.listen()
      const port = fastify.server.address().port

      await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
        internalFetch(port, '/')
      )

      const delayMs = convertToMs(DEFAULT_OPTIONS.delay)

      let response = await internalFetch(port, '/')
      t.equal(await response.text(), 'Hello from fastify-slow-down!')
      t.equal(response.status, 200)
      t.equal(response.headers.get([HEADERS.delay]), delayMs.toString())

      response = await internalFetch(port, '/')
      t.equal(await response.text(), 'Hello from fastify-slow-down!')
      t.equal(response.status, 200)
      t.equal(response.headers.get([HEADERS.delay]), (2 * delayMs).toString())

      response = await internalFetch(port, '/')
      t.equal(await response.text(), 'Hello from fastify-slow-down!')
      t.equal(response.status, 200)
      t.equal(
        response.headers.get([HEADERS.delay]),
        convertToMs(maxDelay).toString()
      )

      response = await internalFetch(port, '/')
      t.equal(await response.text(), 'Hello from fastify-slow-down!')
      t.equal(response.status, 200)
      t.equal(
        response.headers.get([HEADERS.delay]),
        convertToMs(maxDelay).toString()
      )
    }
  )
})
