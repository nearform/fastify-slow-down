import t from 'tap'
import Fastify from 'fastify'

import slowDownPlugin from '../index.js'
import { internalFetch, slowDownAPI } from './helpers.js'
import { HEADERS, DEFAULT_OPTIONS } from '../lib/constants.js'

t.test('should not apply the delay header', async t => {
  t.test('if delay option is 0', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      delay: 0
    })
    t.teardown(() => fastify.close())

    fastify.get('/', async () => 'Hello from fastify-slow-down!')
    await fastify.listen()
    const port = fastify.server.address().port
    console.log('port: ', port)

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
      internalFetch(port, '/')
    )
    const response = await internalFetch(port, '/')

    t.equal(await response.text(), 'Hello from fastify-slow-down!')
    t.equal(response.status, 200)
    t.equal(response.headers.get([HEADERS.delay]), null)
  })

  t.test('if delayAfter option is 0', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      delayAfter: 0
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

  t.test('if timeWindow option is 0', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      timeWindow: 0
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

  t.test('if maxDelay option is 0', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      maxDelay: 0
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
})

t.test('should not apply headers if the headers option is false', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin, {
    headers: false
  })
  t.teardown(() => fastify.close())

  fastify.get('/', async () => 'Hello from fastify-slow-down!')
  await fastify.listen()
  const port = fastify.server.address().port

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => internalFetch(port, '/'))
  const response = await internalFetch(port, '/')

  t.equal(response.headers.get([HEADERS.limit]), null)
  t.equal(response.headers.get([HEADERS.remaining]), null)
  t.equal(response.headers.get([HEADERS.delay]), null)
})
