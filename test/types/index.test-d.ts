import Fastify from 'fastify'
import { expectAssignable } from 'tsd'
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
  }
})

fastify.get('/', req => {
  expectAssignable<{
    limit: number
    delay?: number
    current: number
    remaining: number
  }>(req.slowDown)
})
