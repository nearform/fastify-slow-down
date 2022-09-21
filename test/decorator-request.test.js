import { test } from 'tap'
import Fastify from 'fastify'
import supertest from 'supertest'

import slowDownPlugin from '../index.js'
import { DEFAULT_OPTIONS } from '../lib/constants.js'
import { slowDownAPI } from './helpers.js'
import { convertToMs } from '../lib/helpers.js'

test('should contain the slowDown request decorator', async t => {
  t.test('without delay property', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin)
    t.teardown(() => fastify.close())

    fastify.get('/', async req => req.slowDown)

    const responseBody = await (await fastify.inject('/')).json()

    t.has(responseBody, {
      limit: DEFAULT_OPTIONS.delayAfter,
      current: 1,
      remaining: DEFAULT_OPTIONS.delayAfter - 1,
      delay: undefined
    })
  })

  t.test('with delay property', async t => {
    const fastify = Fastify()
    await fastify.register(slowDownPlugin)
    t.teardown(() => fastify.close())

    fastify.get('/', async req => req.slowDown)

    await fastify.ready()

    await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () =>
      supertest(fastify.server).get('/')
    )
    const response = await supertest(fastify.server).get('/')

    t.has(response.body, {
      limit: DEFAULT_OPTIONS.delayAfter,
      current: DEFAULT_OPTIONS.delayAfter + 1,
      remaining: 0,
      delay: convertToMs(DEFAULT_OPTIONS.delay)
    })
  })
})
