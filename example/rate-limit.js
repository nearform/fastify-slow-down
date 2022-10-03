import Fastify from 'fastify'
import slowDownPlugin from '../index.js'
import rateLimitPlugin from '@fastify/rate-limit'

async function run() {
  const fastify = Fastify({ logger: true })

  // register the rate-limit plugin
  await fastify.register(rateLimitPlugin, {
    max: 1,
    timeWindow: '10 minute'
  })

  // register the slow-down plugin
  await fastify.register(slowDownPlugin, {
    delay: 100,
    delayAfter: 3,
    timeWindow: '10 minute'
  })

  // create a route
  fastify.get('/', async () => 'Hello from fastify-slow-down!')

  // start server
  await fastify.listen({ port: 3000 })
}
run()
