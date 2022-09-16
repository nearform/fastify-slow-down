import Fastify from 'fastify'
import slowDownPlugin from 'fastify-slow-down'

async function run() {
  const fastify = Fastify({ logger: true })
  // register the plugin
  fastify.register(slowDownPlugin)

  // create a route
  fastify.get('/', async (req, reply) => reply.send('Hello fastify-slow-down!'))

  // start server
  await fastify.listen({ port: 3000 })
  console.log('Server: http://localhost:3000')
}
run()
