import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import type Redis from 'ioredis'

type FastifySlowDownOptions = {
  delay?: string | number
  inMemoryCacheSize?: number
  delayAfter?: number
  redis?: Redis
  maxDelay?: string | number
  timeWindow?: string | number
  headers?: boolean
  keyGenerator?: (req: FastifyRequest) => any
  onLimitReached?: (req: FastifyRequest, reply: FastifyReply) => void
  skipFailedRequests?: boolean
  skipSuccessfulRequests?: boolean
  skip?: (req: FastifyRequest, reply: FastifyReply) => boolean
}

declare const fastifySlowDown: FastifyPluginAsync<FastifySlowDownOptions>

declare module 'fastify' {
  export interface FastifyRequest {
    slowDown: {
      limit: number
      delay?: number
      current: number
      remaining: number
    }
  }
}

export { fastifySlowDown, FastifySlowDownOptions }

export default fastifySlowDown
