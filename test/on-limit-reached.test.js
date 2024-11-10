import Fastify from 'fastify'
import { after, describe } from 'node:test'
import sinon from 'sinon'

import slowDownPlugin from '../index.js'
import { internalFetch } from './helpers.js'

describe(
  'should call the onLimitReached option the first time the limit is reached within the time window',
  async () => {
    const fastify = Fastify()

    const onLimitReached = sinon.spy()

    await fastify.register(slowDownPlugin, {
      delayAfter: 1,
      onLimitReached
    })
    after(() => fastify.close())

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
