import { test } from 'tap'
import Fastify from 'fastify'
import slowDownPlugin from '../index.js'
import { HEADERS } from '../lib/constants.js'

test('Should work as a normal API', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  fastify.get('/', async () => 'Hello fastify-slow-down!')

  let res = await fastify.inject('/')

  t.equal(res.statusCode, 200)
  t.equal(res.headers[HEADERS.limit], 0)
  t.equal(res.headers[HEADERS.delay], 1000)
  t.teardown(() => fastify.close())
})
