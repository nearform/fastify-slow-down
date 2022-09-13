import t from 'tap'
import Fastify from 'fastify'
import slowDownPlugin from '../index.js'

t.test('Should works without delay after 1 second', async t => {
  // create the fastify server
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  fastify.get('/', async () => 'tap test!')

  let res = await fastify.inject({
    method: 'GET',
    url: '/'
  })

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

  // wait a second
  let promise = new Promise(res => setTimeout(() => res(), 1000))
  await promise

  res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  t.equal(res.headers['x-slowdown-delay'], 100)

  res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  t.equal(res.headers['x-slowdown-delay'], 200)

  // wait a second
  promise = new Promise(res => setTimeout(() => res(), 1000))
  await promise

  res = await fastify.inject({
    method: 'GET',
    url: '/'
  })
  t.equal(res.headers['x-slowdown-delay'], 100)
})
