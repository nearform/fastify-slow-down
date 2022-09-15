export const DEFAULT_OPTIONS = {
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

export const HEADERS = {
  limit: 'x-slow-down-limit',
  remaining: 'x-slow-down-remaining',
  delay: 'x-slow-down-delay'
}
