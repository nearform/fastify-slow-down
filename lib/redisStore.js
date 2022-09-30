const createKey = (key, namespace) => {
  return namespace + key
}

const REDIS_KEY_TTL_IS_NOT_SET = -1
export class RedisStore {
  constructor(redis, namespace, timeWindowMs) {
    this.redis = redis
    this.timeWindowMs = timeWindowMs
    this.namespace = namespace
  }

  async incrementOnKey(key) {
    const keyWithNamespace = createKey(key, this.namespace)
    const [[errorIncr, counter], ttlResult] = await this.redis
      .pipeline()
      .incr(keyWithNamespace)
      .pttl(keyWithNamespace)
      .exec()
    //this will cover any sensible error that might occur from pttl method as well
    if (errorIncr) {
      throw new Error(errorIncr)
    }

    if (ttlResult[1] === REDIS_KEY_TTL_IS_NOT_SET) {
      await this.redis.pexpire(keyWithNamespace, this.timeWindowMs)
      ttlResult[1] = this.timeWindowMs
    }
    return { counter, ttl: ttlResult[1] }
  }

  async getValue(key) {
    const keyWithNamespace = createKey(key, this.namespace)
    const counter = parseInt((await this.redis.get(keyWithNamespace)) ?? 0)
    return {
      counter
    }
  }

  async decrementOnKey(key) {
    const keyWithNamespace = createKey(key, this.namespace)
    const { counter } = await this.getValue(key)
    if (counter === 0) {
      return
    }
    await this.redis.decr(keyWithNamespace)
  }

  async close() {
    await this.redis.quit()
  }
}
