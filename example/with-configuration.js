import Fastify from 'fastify'
import slowDownPlugin from 'fastify-slow-down'

async function run() {
  const fastify = Fastify({ logger: true })
  // register the plugin
  fastify.register(slowDownPlugin, {
    delay: '10 seconds',
    delayAfter: 10,
    timeWindow: '10 minutes'
  })

  // create a route
  fastify.get('/', async () => 'Hello from fastify-slow-down!')

  // start server
  await fastify.listen({ port: 3000 })
}
run()
