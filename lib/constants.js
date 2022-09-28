export const DEFAULT_OPTIONS = {
  delayAfter: 5,
  inMemoryCacheSize: 5000,
  delay: '1 second',
  timeWindow: '30 seconds',
  maxDelay: Infinity,
  headers: true,
  keyGenerator: req => {
    return req.ip
  },
  skipFailedRequests: false,
  skipSuccessfulRequests: false
}

export const HEADERS = {
  limit: 'x-slow-down-limit',
  remaining: 'x-slow-down-remaining',
  delay: 'x-slow-down-delay'
}
