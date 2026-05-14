import Fastify from 'fastify'
import { expect } from 'tstyche'
import fastifySlowDown from '../..'

const fastify = Fastify()

fastify.register(fastifySlowDown)

fastify.register(fastifySlowDown, {
  delay: 1,
  delayAfter: 1,
  inMemoryCacheSize: 5000,
  headers: true,
  maxDelay: '1 minute',
  timeWindow: '5 minutes',
  keyGenerator(req) {
    req.ip
  },
  onLimitReached(req, reply) {},
  skipFailedRequests: false,
  skipSuccessfulRequests: true,
  skip(req, reply) {
    return false
  }
})

fastify.get('/', req => {
  expect(req.slowDown).type.toBe<{
    limit: number
    delay?: number
    current: number
    remaining: number
  }>()
})
