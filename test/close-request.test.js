import t from 'tap'
import Fastify from 'fastify'
import FakeTimers from '@sinonjs/fake-timers'
import slowDownPlugin from '../index.js'
import { HEADERS } from '../lib/constants.js'

t.test('Check the response time with 2 enpoints', async t => {
  t.context.clock = FakeTimers.install()
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  fastify.get('/cancel', async () => 'Hello fastify-slow-down!')
  t.context.clock.tick(1)

  const response = await fastify.inject({
    path: '/cancel',
    method: 'GET',
    simulate: {
      close: true
    }
  })

  t.equal(response.headers[HEADERS.closed], true)

  t.teardown(() => {
    t.context.clock.uninstall()
    fastify.close()
  })
})
