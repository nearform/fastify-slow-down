import Fastify from 'fastify'
import { after, describe, test } from 'node:test'

import slowDownPlugin from '../index.js'
import { DEFAULT_OPTIONS, HEADERS } from '../lib/constants.js'
import { internalFetch, slowDownAPI } from './helpers.js'

describe('should not apply the delay header', () => {
  test('if delay option is 0', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      delay: 0
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

  test('if delayAfter option is 0', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      delayAfter: 0
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

  test('if timeWindow option is 0', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      timeWindow: 0
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

  test('if maxDelay option is 0', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin, {
      maxDelay: 0
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
})

test('should not apply headers if the headers option is false', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin, {
    headers: false
  })
  after(() => fastify.close())

  fastify.get('/', async () => 'Hello from fastify-slow-down!')
  await fastify.listen()
  const port = fastify.server.address().port

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => internalFetch(port, '/'))
  const response = await internalFetch(port, '/')

  t.assert.equal(response.headers.get([HEADERS.limit]), null)
  t.assert.equal(response.headers.get([HEADERS.remaining]), null)
  t.assert.equal(response.headers.get([HEADERS.delay]), null)
})

test('should not apply headers if the headers option is false and skipSuccessfulRequests is true', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin, {
    headers: false,
    skipSuccessfulRequests: true
  })
  after(() => fastify.close())

  fastify.get('/', async () => 'Hello from fastify-slow-down!')
  await fastify.listen()
  const port = fastify.server.address().port

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => internalFetch(port, '/'))
  const response = await internalFetch(port, '/')

  t.assert.equal(response.headers.get([HEADERS.limit]), null)
  t.assert.equal(response.headers.get([HEADERS.remaining]), null)
  t.assert.equal(response.headers.get([HEADERS.delay]), null)
})

test('should not apply headers if the headers option is false and skipFailedRequests is true', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin, {
    headers: false,
    skipFailedRequests: true
  })
  after(() => fastify.close())

  fastify.get('/', async () => {
    throw new Error('Request failed')
  })
  await fastify.listen()
  const port = fastify.server.address().port

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => internalFetch(port, '/'))
  const response = await internalFetch(port, '/')

  t.assert.equal(response.headers.get([HEADERS.limit]), null)
  t.assert.equal(response.headers.get([HEADERS.remaining]), null)
  t.assert.equal(response.headers.get([HEADERS.delay]), null)
})
