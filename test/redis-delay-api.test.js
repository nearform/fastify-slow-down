import { test } from 'tap'
import Fastify from 'fastify'
import sinon from 'sinon'
import slowDownPlugin from '../index.js'
import { RedisStore } from '../lib/redisStore.js'
import { convertToMs } from '../lib/helpers.js'
import { HEADERS, DEFAULT_OPTIONS } from '../lib/constants.js'
import { internalFetch, slowDownAPI } from './helpers.js'
import Redis from 'ioredis'

const REDIS_HOST = '127.0.0.1'
test('should delay the API using redis with basic options', async t => {
  const closeSpy = sinon.spy(RedisStore.prototype, 'close')
  const redis = new Redis({ host: REDIS_HOST })
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
  t.equal(await response.text(), 'Hello from fastify-slow-down!')
  t.equal(response.status, 200)
  t.equal(response.headers.get([HEADERS.delay]), delayMs.toString())

  response = await internalFetch(port, '/')
  t.equal(await response.text(), 'Hello from fastify-slow-down!')
  t.equal(response.status, 200)
  t.equal(response.headers.get([HEADERS.delay]), (2 * delayMs).toString())
  await redis.flushall()
  await fastify.close()
  sinon.assert.calledOnce(closeSpy)
})
