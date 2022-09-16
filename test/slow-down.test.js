import { test } from 'tap'
import Fastify from 'fastify'
import slowDownPlugin from '../index.js'
import { HEADERS } from '../lib/constants.js'

test('Should start to delay the API', async t => {
  // create the fastify server
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  fastify.get('/', async () => 'Hello fastify-slow-down!')
  t.teardown(() => fastify.close())

  let res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.limit], 0)
  t.equal(res.headers[HEADERS.delay], 1000)

  res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.delay], 2000)

  res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.delay], 3000)

  res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.delay], 4000)
})
