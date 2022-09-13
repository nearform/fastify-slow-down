import ms from 'ms'
import { Store } from './store.js'

const defaultOptions = {
  /**
   * maxUntilDelay: number
   * how many request until it is starting to delay the responses
   * default: 0
   */
  maxUntilDelay: 0,
  /**
   * delayMs: string | number
   * 1 minutes/seconds
   * Number(1000) - 1000 miliseconds
   * default  100 miliseconds
   */
  delay: 100,
  /**
   * timeWindow: string | number
   * 1 minutes/seconds/miliseconds
   * Number(1000) - 1000 miliseconds
   * default  1 second
   */
  timeWindow: '1 second',
  /**
   * keyGenerator: function
   * generate an unique key
   * default: user IP
   */
  keyGenerator: req => {
    return req.ip
  }
}
export const resetExpireTime = ms => {
  const date = new Date()
  date.setMilliseconds(ms)
  return date
}

const convertToMs = time => {
  if (typeof time === 'number') return time
  if (typeof time === 'string') {
    return ms(time)
  }
  return 1000
}

export const slowDownRequestHandler = () => {
  const options = {
    ...defaultOptions,
    store: new Store(convertToMs(defaultOptions.timeWindow))
  }
  return async (req, reply) => {
    const value = options.store.incrementOnKey(options.keyGenerator(req))
    const delay =
      value > options.maxUntilDelay
        ? (value - options.maxUntilDelay) * convertToMs(options.delay)
        : 0
    reply.header('X-SlowDown-Limit', options.maxUntilDelay)
    reply.header(
      'X-SlowDown-Remaining',
      Math.max(options.maxUntilDelay - value, 0)
    )
    if (delay !== 0) {
      reply.header('X-SlowDown-Delay', delay)
      const promise = new Promise(res => {
        setTimeout(() => {
          res()
        }, delay)
      })
      await promise
    }
  }
}
