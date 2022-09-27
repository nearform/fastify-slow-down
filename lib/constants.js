export const DEFAULT_OPTIONS = {
  delayAfter: 5,
  cacheSize: 5000,
  delay: '1 second',
  intervalTimeExpiredKeys: '15 minutes',
  timeWindow: '30 seconds',
  maxDelay: Infinity,
  headers: true,
  keyGenerator: req => {
    return req.ip
  }
}

export const HEADERS = {
  limit: 'x-slow-down-limit',
  remaining: 'x-slow-down-remaining',
  delay: 'x-slow-down-delay'
}
