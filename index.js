import fp from 'fastify-plugin'
import onFinished from 'on-finished'

import { DEFAULT_OPTIONS, HEADERS } from './lib/constants.js'
import { calculateDelay, convertToMs } from './lib/helpers.js'
import { Store } from './lib/store.js'

const slowDownPlugin = async (fastify, settings) => {
  const options = { ...DEFAULT_OPTIONS, ...settings }
  const store = new Store(
    convertToMs(options.timeWindow),
    options.inMemoryCacheSize
  )

  const applySkip = async (req, reply, key) => {
    await store.decrementOnKey(key)
    if (options.headers && req.slowDown.remaining < options.delayAfter) {
      reply.header(HEADERS.remaining, req.slowDown.remaining + 1)
    }
  }

  fastify.decorateRequest('slowDown', null)

  fastify.addHook('onClose', () => store.close())

  fastify.addHook('onRequest', async (req, reply) => {
    if (options.skip?.(req, reply)) {
      return
    }

    const key = options.keyGenerator(req)
    const { counter: requestCounter } = store.incrementOnKey(key)
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

  fastify.addHook('onSend', async (req, reply) => {
    const key = options.keyGenerator(req)
    if (options.skipFailedRequests && reply.statusCode >= 400) {
      await applySkip(req, reply, key)
    }

    if (options.skipSuccessfulRequests && reply.statusCode < 400) {
      await applySkip(req, reply, key)
    }
  })
}

export default fp(slowDownPlugin, {
  fastify: '4.x',
  name: 'fastify-slow-down'
})
