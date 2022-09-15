import t from 'tap'
import Fastify from 'fastify'
import slowDownPlugin from '../index.js'
import { sleep } from '../lib/helpers.js'
import { HEADERS } from '../lib/constants.js'

t.test('Should works without delay after 1 second', async t => {
  // create the fastify server
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  fastify.get('/', async () => 'Hello from Fastify!')

  let res = await fastify.inject('/')

  res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.delay], 200)

  res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.delay], 300)

  // wait a second
  await sleep(1000)

  res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.delay], 100)

  res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.delay], 200)

  // wait a second
  await sleep(1000)

  res = await fastify.inject('/')
  t.equal(res.headers[HEADERS.delay], 100)
  t.teardown(() => fastify.close())
})
