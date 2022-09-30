import Fastify from 'fastify'
import t from 'tap'

import slowDownPlugin from '../index.js'
import { DEFAULT_OPTIONS, HEADERS } from '../lib/constants.js'
import { internalFetch, slowDownAPI } from './helpers.js'

t.test('should not apply the delay header', async t => {
  t.test('if the option skip function returns true', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      skip: () => true
    })
    t.teardown(() => fastify.close())

    fastify.get('/', async () => 'Hello from fastify-slow-down!')
    await fastify.listen()
    const port = fastify.server.address().port

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
      internalFetch(port, '/')
    )
    const response = await internalFetch(port, '/')

    t.equal(await response.text(), 'Hello from fastify-slow-down!')
    t.equal(response.status, 200)
    t.equal(response.headers.get([HEADERS.delay]), null)
  })

  t.test(
    'if skipSuccessfulRequests is true and the request is a success',
    async t => {
      const fastify = Fastify()
      await fastify.register(slowDownPlugin, {
        skipSuccessfulRequests: true
      })
      t.teardown(() => fastify.close())

      fastify.get('/', async () => 'Hello from fastify-slow-down!')
      await fastify.listen()
      const port = fastify.server.address().port

      await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
        internalFetch(port, '/')
      )
      const response = await internalFetch(port, '/')

      t.equal(await response.text(), 'Hello from fastify-slow-down!')
      t.equal(response.status, 200)
      t.equal(response.headers.get([HEADERS.delay]), null)
    }
  )

  t.test('if skipFailedRequests is true and the request fails', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      skipFailedRequests: true
    })
    t.teardown(() => fastify.close())

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

    t.equal(response.status, 500)
    t.equal(response.headers.get([HEADERS.delay]), null)
    t.equal(
      parseInt(response.headers.get([HEADERS.remaining])),
      DEFAULT_OPTIONS.delayAfter - 1
    )
  })

  t.test(
    'if skipSuccessfulRequests is true and the request succeeds and one fail it updates remaining header value properly',
    async t => {
      const fastify = Fastify()
      await fastify.register(slowDownPlugin, {
        skipSuccessfulRequests: true
      })
      t.teardown(() => fastify.close())
      let test = {
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

      console.log(response.headers.get([HEADERS.remaining]))

      t.equal(response.status, 200)
      t.equal(response.headers.get([HEADERS.delay]), null)
      t.equal(
        parseInt(response.headers.get([HEADERS.remaining])),
        DEFAULT_OPTIONS.delayAfter - 1
      )
    }
  )
})
