import t from 'tap'
import Fastify from 'fastify'
import FakeTimers from '@sinonjs/fake-timers'
import slowDownPlugin from '../index.js'
import { HEADERS } from '../lib/constants.js'

t.test('Check the response time with 2 enpoints', async t => {
  t.context.clock = FakeTimers.install()
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  t.teardown(() => {
    t.context.clock.uninstall()
    fastify.close()
  })

  fastify.get('/', async () => 'Hello fastify-slow-down!')
  fastify.get('/fastify', () => 'Welcome fastify-slow-down!')
  t.context.clock.tick(1)
  let response = await fastify.inject('/')
  t.equal(response.statusCode, 200)
  t.equal(response.headers[HEADERS.delay], 1000)

  response = await fastify.inject('/fastify')
  t.equal(response.statusCode, 200)
  t.equal(response.headers[HEADERS.delay], 2000)

  t.context.clock.tick(1000)
  response = await fastify.inject('/fastify')
  t.equal(response.statusCode, 200)
  t.equal(response.headers[HEADERS.delay], 3000)

  t.context.clock.tick(31 * 1000)
  response = await fastify.inject('/')
  t.equal(response.statusCode, 200)
  t.equal(response.headers[HEADERS.delay], 1000)
})
