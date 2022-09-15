import { test } from 'tap'
import Fastify from 'fastify'
import slowDownPlugin from '../index.js'
import { HEADERS } from '../lib/constants.js'

test('Should start to delay the API', async t => {
  // create the fastify server
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  fastify.get('/', async () => 'Hello from Fastify!')

  let res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.limit], 0)
  t.equal(res.headers[HEADERS.delay], 100)

  res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.delay], 200)

  res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.delay], 300)

  res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.delay], 400)
  t.teardown(() => fastify.close())
})
