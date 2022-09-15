import fp from 'fastify-plugin'
import { DEFAULT_OPTIONS, HEADERS } from './lib/constants.js'
import { Store } from './lib/store.js'
import { convertToMs, sleep } from './lib/helpers.js'
import onFinished from 'on-finished'

const slowDownPlugin = async fastify => {
  const options = { ...DEFAULT_OPTIONS }
  const store = new Store(convertToMs(options.timeWindow))
  fastify.addHook('onClose', () => store.close())
  fastify.addHook('onRequest', async (req, reply) => {
    const value = store.incrementOnKey(options.keyGenerator(req))
    const delay =
      value > options.maxUntilDelay
        ? (value - options.maxUntilDelay) * convertToMs(options.delay)
        : 0
    reply.header(HEADERS.limit, options.maxUntilDelay)
    reply.header(HEADERS.remaining, Math.max(options.maxUntilDelay - value, 0))
    if (delay !== 0) {
      reply.header(HEADERS.delay, delay)
      onFinished(req, () => {
        return reply
      })
      await sleep(delay)
    }
  })
}

export default fp(slowDownPlugin, {
  fastify: '4.x',
  name: 'fastify-slow-down'
})
