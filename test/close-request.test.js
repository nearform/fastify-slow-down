import Fastify from 'fastify'
import { after, test } from 'node:test'

import slowDownPlugin from '../index.js'
import { DEFAULT_OPTIONS, HEADERS } from '../lib/constants.js'
import { convertToMs } from '../lib/helpers.js'
import { slowDownAPI } from './helpers.js'

test('should get an empty response if the request was cancelled', async t => {
  const fastify = Fastify()
  await fastify.register(slowDownPlugin)
  after(() => fastify.close())

  fastify.get('/cancel', async () => 'Canceled request')

  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => fastify.inject('/cancel'))

  const response = await fastify.inject({
    path: '/cancel',
    method: 'GET',
    simulate: {
      close: true
    }
  })

  t.assert.assert.equal(response.body, '')
  t.assert.assert.equal(
    response.headers[HEADERS.delay],
    String(convertToMs(DEFAULT_OPTIONS.delay))
  )
  t.assert.assert.equal(response.headers[HEADERS.limit], String(DEFAULT_OPTIONS.delayAfter))
  t.assert.assert.equal(response.headers[HEADERS.remaining], String(0))
})
