import fp from 'fastify-plugin'
import onFinished from 'on-finished'
import defaults from 'defaults'

import { DEFAULT_OPTIONS, HEADERS } from './lib/constants.js'
import { Store } from './lib/store.js'
import { convertToMs, calculateDelay } from './lib/helpers.js'

const slowDownPlugin = async (fastify, settings) => {
  const options = defaults(settings, DEFAULT_OPTIONS)
  const store = new Store(convertToMs(options.timeWindow))

  fastify.addHook('onClose', () => store.close())

  fastify.addHook('onRequest', async (req, reply) => {
    const requestCounter = store.incrementOnKey(options.keyGenerator(req))
    const delayMs = calculateDelay(requestCounter, options)

    reply.header(HEADERS.limit, options.delayAfter)
    reply.header(
      HEADERS.remaining,
      Math.max(options.delayAfter - requestCounter, 0)
    )

    if (delayMs <= 0) {
      return
    }
    reply.header(HEADERS.delay, delayMs)
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
