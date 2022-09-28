import { lru } from 'tiny-lru'
export class Store {
  constructor(timeWindowMs, evictionIntervalMs, cacheSize) {
    this.timeWindowMs = timeWindowMs
    this.cache = lru(cacheSize, timeWindowMs)
    this.interval = setInterval(() => {
      this.cache.keys().forEach(key => {
        this.cache.get(key) // it deletes expired keys under the hood and returns undefined
      })
    }, evictionIntervalMs)
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

  close() {
    clearInterval(this.interval)
    this.cache.clear()
  }
}
