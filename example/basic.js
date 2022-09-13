import Fastify from 'fastify'
import slowDownPlugin from '../index.js'

const fastify = Fastify()
// register the plugin
fastify.register(slowDownPlugin)

// create a route
fastify.get('/', async (req, reply) => reply.send('tap test!'))

// start server
fastify.listen({ port: 3000 }, err => {
  if (err) throw err
  console.log('Server: http://localhost:3000')
})
