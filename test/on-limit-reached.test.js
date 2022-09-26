import Fastify from 'fastify'
import sinon from 'sinon'
import t from 'tap'

import slowDownPlugin from '../index.js'
import { internalFetch } from './helpers.js'

t.test(
  'should call the onLimitReached option the first time the limit is reached within the time window',
  async t => {
    const fastify = Fastify()

    const onLimitReached = sinon.spy()

    await fastify.register(slowDownPlugin, {
      delayAfter: 1,
      onLimitReached
    })
    t.teardown(() => fastify.close())

    fastify.get('/', async () => 'Hello from fastify-slow-down!')
    await fastify.listen()
    const port = fastify.server.address().port

    await internalFetch(port, '/')
    sinon.assert.notCalled(onLimitReached)

    await internalFetch(port, '/')
    sinon.assert.calledOnce(onLimitReached)

    await internalFetch(port, '/')
    sinon.assert.calledOnce(onLimitReached)
  }
)
