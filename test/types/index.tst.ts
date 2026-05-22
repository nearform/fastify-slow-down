import Fastify from 'fastify'
import { expect } from 'tstyche'
import type { FastifyRequest, FastifyReply } from 'fastify'
import fastifySlowDown from '../../index.js'

const fastify = Fastify()

fastify.register(fastifySlowDown)

fastify.register(fastifySlowDown, {
  delay: 1,
  delayAfter: 1,
  inMemoryCacheSize: 5000,
  headers: true,
  maxDelay: '1 minute',
  timeWindow: '5 minutes',
  keyGenerator(req: FastifyRequest) {
    req.ip
  },
  onLimitReached(req: FastifyRequest, reply: FastifyReply) {},
  skipFailedRequests: false,
  skipSuccessfulRequests: true,
  skip(req: FastifyRequest, reply: FastifyReply) {
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
