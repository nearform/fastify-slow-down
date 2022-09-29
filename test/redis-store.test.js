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
  const { counter: secondCounter, ttl: ttlAfter } = await store.incrementOnKey(
    '1'
  )
  t.equal(secondCounter, 2)
  t.not(ttlAfter, convertToMs(DEFAULT_OPTIONS.timeWindow))
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
