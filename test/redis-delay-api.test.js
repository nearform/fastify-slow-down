import Fastify from 'fastify'
import Redis from 'ioredis'
import { test } from 'node:test'
import sinon from 'sinon'
import slowDownPlugin from '../index.js'
import { DEFAULT_OPTIONS, HEADERS } from '../lib/constants.js'
import { convertToMs } from '../lib/helpers.js'
import { RedisStore } from '../lib/redisStore.js'
import { internalFetch, slowDownAPI } from './helpers.js'

const REDIS_HOST = '127.0.0.1'

async function checkRedisAvailable() {
  const redis = new Redis({
    host: REDIS_HOST,
    lazyConnect: true,
    connectTimeout: 2000,
    retryStrategy: () => null
  })
  redis.on('error', () => {})

  try {
    await Promise.race([
      redis.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 2000)
      )
    ])
    await redis.quit()
    return true
  } catch {
    try {
      await redis.quit()
    } catch {
      // Ignore quit errors
    }
    return false
  }
}

const redisAvailable = await checkRedisAvailable()

test('should delay the API using redis with basic options', async t => {
  if (!redisAvailable) {
    t.skip('Redis is not available')
    return
  }
  const closeSpy = sinon.spy(RedisStore.prototype, 'close')
  const redis = new Redis({ host: REDIS_HOST, lazyConnect: true })
  redis.on('error', () => {})
  await redis.connect()
  const fastify = Fastify()
  await fastify.register(slowDownPlugin, {
    redis
  })

  fastify.get('/', async () => 'Hello from fastify-slow-down!')
  await fastify.listen()
  const port = fastify.server.address().port

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => internalFetch(port, '/'))

  const delayMs = convertToMs(DEFAULT_OPTIONS.delay)

  let response = await internalFetch(port, '/')
  t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
  t.assert.equal(response.status, 200)
  t.assert.equal(response.headers.get([HEADERS.delay]), delayMs.toString())

  response = await internalFetch(port, '/')
  t.assert.equal(await response.text(), 'Hello from fastify-slow-down!')
  t.assert.equal(response.status, 200)
  t.assert.equal(
    response.headers.get([HEADERS.delay]),
    (2 * delayMs).toString()
  )
  await redis.flushall()
  await fastify.close()
  sinon.assert.calledOnce(closeSpy)
})
