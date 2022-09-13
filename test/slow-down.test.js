import { test } from 'tap'
import Fastify from 'fastify'
import slowDownPlugin from '../index.js'

test('Should start to delay the API', async t => {
  // create the fastify server
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  fastify.get('/', async () => 'tap test!')

  let res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  t.equal(res.headers['x-slowdown-limit'], 0)
  t.equal(res.headers['x-slowdown-delay'], 100)

  res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  t.equal(res.headers['x-slowdown-delay'], 200)

  res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  t.equal(res.headers['x-slowdown-delay'], 300)

  res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  t.equal(res.headers['x-slowdown-delay'], 400)
})
