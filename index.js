import fp from 'fastify-plugin'
import { slowDownRequestHandler } from './lib/utils.js'

/**
 * How it's working:
 * Keep in memory the records by ip {"192.0.0.1": 2, "ip": count}
 * when the limit (by deafault 0) is reached by record, start to delay the response with delayMs (1000) (ms)
 * reset to default records when after keepInMemoryMS (1000) API inactivity
 */

async function slowDownPlugin(fastify) {
  fastify.addHook('onRequest', slowDownRequestHandler())
}

export default fp(slowDownPlugin, {
  fastify: '4.x',
  name: 'fastify-slow-down'
})
