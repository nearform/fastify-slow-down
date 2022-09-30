import Redis from 'ioredis'
import Fastify from 'fastify'
import slowDownPlugin from '../index.js'

const redis = id =>
  new Redis({
    connectionName: 'my-connection-name' + id,
    host: 'localhost',
    port: 6379,
    connectTimeout: 500,
    maxRetriesPerRequest: 1
  })

async function run(port) {
  const fastify = Fastify({ logger: true })
  // register the plugin
  fastify.register(slowDownPlugin, {
    redis: redis(port)
  })

  // create a route
  fastify.get('/', async () => 'Hello from fastify-slow-down!')

  // start server
  await fastify.listen({ port })
}
run(3000)
run(4000)
