import {
  FastifyPluginAsync,
  FastifyPluginCallback,
  FastifyRequest
} from 'fastify'

type FastifySlowDownOptions = {
  delay?: string | number
  inMemoryCacheSize?: string | number
  delayAfter?: number
  maxDelay?: string | number
  timeWindow?: string | number
  headers?: boolean
  keyGenerator?: (req: FastifyRequest) => any
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
