import { lru } from 'tiny-lru'
export class Store {
  constructor(timeWindowMs, cacheSize) {
    this.timeWindowMs = timeWindowMs
    this.cache = lru(cacheSize, timeWindowMs)
  }

  incrementOnKey(key) {
    const nowMs = Date.now()
    // get called on the expired key deletes it under the hood and returns undefined
    const current = this.cache.get(key) || {
      counter: 0,
      startCountingTimeMs: nowMs
    }
    current.counter++
    this.cache.set(key, current)
    const timePassedMs = nowMs - current.startCountingTimeMs
    return {
      counter: current.counter,
      ttl: this.timeWindowMs - timePassedMs
    }
  }

  decrementOnKey(key) {
    const current = this.cache.get(key)
    if (!current || current.counter === 0) {
      return
    }

    current.counter--
    this.cache.set(key, current)
  }

  close() {
    this.cache.clear()
  }
}
