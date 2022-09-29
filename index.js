import fp from 'fastify-plugin'
import onFinished from 'on-finished'

import { RedisStore } from './lib/redisStore.js'
import { DEFAULT_OPTIONS, HEADERS } from './lib/constants.js'
import { calculateDelay, convertToMs } from './lib/helpers.js'
import { Store } from './lib/store.js'

const slowDownPlugin = async (fastify, settings) => {
  const options = { ...DEFAULT_OPTIONS, ...settings }
  const store = settings.redis
    ? new RedisStore(
        settings.redis,
        'fastify-slow-down',
        convertToMs(options.timeWindow)
      )
    : new Store(convertToMs(options.timeWindow), options.inMemoryCacheSize)

  fastify.decorateRequest('slowDown', null)

  fastify.addHook('onClose', () => store.close())

  fastify.addHook('onRequest', async (req, reply) => {
    if (options.skip?.(req, reply)) {
      return
    }

    const key = options.keyGenerator(req)
    const { counter: requestCounter } = await store.incrementOnKey(key)
    const delayMs = calculateDelay(requestCounter, options)
    const hasDelay = delayMs > 0
    const remainingRequests = Math.max(options.delayAfter - requestCounter, 0)

    if (options.headers) {
      reply.header(HEADERS.limit, options.delayAfter)
      reply.header(HEADERS.remaining, remainingRequests)
      hasDelay && reply.header(HEADERS.delay, delayMs)
    }

    req.slowDown = {
      limit: options.delayAfter,
      delay: hasDelay ? delayMs : undefined,
      current: requestCounter,
      remaining: remainingRequests
    }

    if (options.skipFailedRequests) {
      onFinished(reply.raw, err => {
        if (err || reply.statusCode >= 400) {
          store.decrementOnKey(key)
        }
      })
    }

    if (options.skipSuccessfulRequests) {
      onFinished(reply.raw, err => {
        if (!err && reply.statusCode < 400) {
          store.decrementOnKey(key)
        }
      })
    }

    if (!hasDelay) {
      return
    }

    if (requestCounter - 1 === options.delayAfter) {
      options.onLimitReached?.(req, reply, options)
    }

    let timeout, resolve

    const promise = new Promise(res => {
      resolve = res
      timeout = setTimeout(res, delayMs)
    })

    onFinished(req.raw, () => {
      clearTimeout(timeout)
      resolve('requestFinished')
    })

    const promiseResult = await promise

    if (promiseResult === 'requestFinished') {
      reply.send('')
      return reply
    }
  })
}

export default fp(slowDownPlugin, {
  fastify: '4.x',
  name: 'fastify-slow-down'
})
