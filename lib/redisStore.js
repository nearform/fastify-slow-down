import { REDIS_KEY_TTL_IS_NOT_SET } from './constants.js'

export class RedisStore {
  constructor(redis, namespace, timeWindowMs) {
    this.redis = redis
    this.timeWindowMs = timeWindowMs
    this.namespace = namespace
  }

  async incrementOnKey(key) {
    const keyWithNamespace = this.namespace + key
    const [[errorIncr, counter], ttlResult] = await this.redis
      .pipeline()
      .incr(keyWithNamespace)
      .pttl(keyWithNamespace)
      .exec()
    if (errorIncr) {
      throw new Error(errorIncr)
    }
    const [errorTTL] = ttlResult
    if (errorTTL) {
      throw new Error(errorTTL)
    }

    if (ttlResult[1] === REDIS_KEY_TTL_IS_NOT_SET) {
      await this.redis.pexpire(keyWithNamespace, this.timeWindowMs)
      ttlResult[1] = this.timeWindowMs
    }
    return { counter, ttl: ttlResult[1] }
  }

  close() {
    this.redis.quit()
  }
}
