import { test } from 'tap'
import Redis from 'ioredis'
import sinon from 'sinon'
import FakeTimers from '@sinonjs/fake-timers'
import { convertToMs } from '../lib/helpers.js'
import { RedisStore } from '../lib/redisStore.js'
import { DEFAULT_OPTIONS } from '../lib/constants.js'

const REDIS_HOST = '127.0.0.1'

test('should increment counter in a specified key and return stored value', async t => {
  const redis = new Redis({ host: REDIS_HOST })
  const clock = FakeTimers.install()
  t.teardown(async () => {
    clock.uninstall()
    await redis.flushall()
    await redis.quit()
  })

  const store = new RedisStore(
    redis,
    'fastify-slow-down',
    convertToMs(DEFAULT_OPTIONS.timeWindow)
  )
  const { counter, ttl } = await store.incrementOnKey('1')
  t.equal(counter, 1)
  t.equal(ttl, convertToMs(DEFAULT_OPTIONS.timeWindow))
  clock.tick(convertToMs(DEFAULT_OPTIONS.timeWindow))
  const { counter: secondCounter, ttl: ttlAfter } =
    await store.incrementOnKey('1')
  t.equal(secondCounter, 2)
  t.not(ttlAfter, convertToMs(DEFAULT_OPTIONS.timeWindow))
})

test('should decrement counter for a given key if counter is greater than 0 and otherwise should have no effects', async t => {
  const redis = new Redis({ host: REDIS_HOST })
  t.teardown(async () => {
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

  t.equal(firstResult, 1)

  await store.decrementOnKey(key)
  await store.decrementOnKey(key)
  await store.decrementOnKey(key)
  await store.decrementOnKey(key)
  const { counter: secondResult } = await store.getValue(key)

  t.equal(secondResult, 0)
})

test('should return counter for a given key', async t => {
  const redis = new Redis({ host: REDIS_HOST })
  const store = new RedisStore(
    redis,
    'fastify-slow-down',
    convertToMs(DEFAULT_OPTIONS.timeWindow)
  )
  t.teardown(async () => {
    await redis.flushall()
    await redis.quit()
  })
  await store.incrementOnKey('1')
  const { counter } = await store.getValue('1')
  t.equal(counter, 1)
})

test('should return a default counter for a given key if key is not set', async t => {
  const redis = new Redis({ host: REDIS_HOST })
  const store = new RedisStore(
    redis,
    'fastify-slow-down',
    convertToMs(DEFAULT_OPTIONS.timeWindow)
  )
  t.teardown(async () => {
    await redis.flushall()
    await redis.quit()
  })
  const { counter } = await store.getValue('1')
  t.equal(counter, 0)
})

test('should have called the redis quit method when store has been closed', async t => {
  const redis = new Redis({ host: REDIS_HOST })

  t.teardown(async () => {
    await redis.quit()
  })

  const store = new RedisStore(
    redis,
    'fastify-slow-down',
    convertToMs(DEFAULT_OPTIONS.timeWindow)
  )
  let quitSpy = sinon.spy(redis, 'quit')
  await store.close()
  quitSpy.restore()
  sinon.assert.calledOnce(quitSpy)
})

test('should throws an error when redis is not connected', async t => {
  const redis = new Redis({ host: REDIS_HOST })

  const store = new RedisStore(
    redis,
    'fastify-slow-down',
    convertToMs(DEFAULT_OPTIONS.timeWindow)
  )
  await redis.flushall()
  await redis.quit()
  t.rejects(() => store.incrementOnKey('1'))
})
