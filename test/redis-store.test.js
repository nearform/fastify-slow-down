import Redis from 'ioredis'
import { after, test } from 'node:test'
import sinon from 'sinon'
import { DEFAULT_OPTIONS } from '../lib/constants.js'
import { convertToMs } from '../lib/helpers.js'
import { RedisStore } from '../lib/redisStore.js'

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

test('should increment counter in a specified key and return stored value', async t => {
  if (!redisAvailable) {
    t.skip('Redis is not available')
    return
  }
  const redis = new Redis({ host: REDIS_HOST, lazyConnect: true })
  redis.on('error', () => {})
  await redis.connect()
  t.after(async () => {
    await redis.flushall()
    await redis.quit()
  })

  const store = new RedisStore(
    redis,
    'fastify-slow-down',
    convertToMs(DEFAULT_OPTIONS.timeWindow)
  )
  const { counter, ttl } = await store.incrementOnKey('1')
  t.assert.equal(counter, 1)
  t.assert.equal(ttl, convertToMs(DEFAULT_OPTIONS.timeWindow))
  const { counter: secondCounter, ttl: ttlAfter } =
    await store.incrementOnKey('1')
  t.assert.equal(secondCounter, 2)
  t.assert.notEqual(ttlAfter, convertToMs(DEFAULT_OPTIONS.timeWindow))
})

test('should decrement counter for a given key if counter is greater than 0 and otherwise should have no effects', async t => {
  if (!redisAvailable) {
    t.skip('Redis is not available')
    return
  }
  const redis = new Redis({ host: REDIS_HOST, lazyConnect: true })
  redis.on('error', () => {})
  await redis.connect()
  after(async () => {
    await redis.flushall()
    await redis.quit()
  })
  const store = new RedisStore(
    redis,
    'fastify-slow-down',
    convertToMs(DEFAULT_OPTIONS.timeWindow)
  )
  const key = '1'

  await store.decrementOnKey(key)
  await store.incrementOnKey(key)
  const { counter: firstResult } = await store.getValue(key)

  t.assert.equal(firstResult, 1)

  await store.decrementOnKey(key)
  await store.decrementOnKey(key)
  await store.decrementOnKey(key)
  await store.decrementOnKey(key)
  const { counter: secondResult } = await store.getValue(key)

  t.assert.equal(secondResult, 0)
})

test('should return counter for a given key', async t => {
  if (!redisAvailable) {
    t.skip('Redis is not available')
    return
  }
  const redis = new Redis({ host: REDIS_HOST, lazyConnect: true })
  redis.on('error', () => {})
  await redis.connect()
  const store = new RedisStore(
    redis,
    'fastify-slow-down',
    convertToMs(DEFAULT_OPTIONS.timeWindow)
  )
  after(async () => {
    await redis.flushall()
    await redis.quit()
  })
  await store.incrementOnKey('1')
  const { counter } = await store.getValue('1')
  t.assert.equal(counter, 1)
})

test('should return a default counter for a given key if key is not set', async t => {
  if (!redisAvailable) {
    t.skip('Redis is not available')
    return
  }
  const redis = new Redis({ host: REDIS_HOST, lazyConnect: true })
  redis.on('error', () => {})
  await redis.connect()
  const store = new RedisStore(
    redis,
    'fastify-slow-down',
    convertToMs(DEFAULT_OPTIONS.timeWindow)
  )
  after(async () => {
    await redis.flushall()
    await redis.quit()
  })
  const { counter } = await store.getValue('1')
  t.assert.equal(counter, 0)
})

test('should have called the redis quit method when store has been closed', async t => {
  if (!redisAvailable) {
    t.skip('Redis is not available')
    return
  }
  const redis = new Redis({ host: REDIS_HOST, lazyConnect: true })
  redis.on('error', () => {})
  await redis.connect()

  const store = new RedisStore(
    redis,
    'fastify-slow-down',
    convertToMs(DEFAULT_OPTIONS.timeWindow)
  )
  const quitSpy = sinon.spy(redis, 'quit')
  await store.close()
  quitSpy.restore()
  sinon.assert.calledOnce(quitSpy)
})

test('should throws an error when redis is not connected', async t => {
  if (!redisAvailable) {
    t.skip('Redis is not available')
    return
  }
  const redis = new Redis({ host: REDIS_HOST, lazyConnect: true })
  redis.on('error', () => {})
  await redis.connect()

  const store = new RedisStore(
    redis,
    'fastify-slow-down',
    convertToMs(DEFAULT_OPTIONS.timeWindow)
  )
  await redis.flushall()
  await redis.quit()
  await t.assert.rejects(() => store.incrementOnKey('1'))
})
