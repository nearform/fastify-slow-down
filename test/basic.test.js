import { test } from 'tap'
import Fastify from 'fastify'
import slowDownPlugin from '../index.js'

test('Should work as a normal API', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  fastify.get('/', async () => 'tap test!')

  let res = await fastify.inject({
    method: 'GET',
    url: '/'
  })

  t.equal(res.statusCode, 200)
  t.equal(res.headers['x-slowdown-limit'], 0)
  t.equal(res.headers['x-slowdown-delay'], 100)
  t.pass()
  t.end()
})
