export class Store {
  constructor(timeWindowMs) {
    this.timeWindowMs = timeWindowMs
    this.resetStore()
    this.interval = setInterval(() => this.resetStore(), timeWindowMs)
  }

  resetStore() {
    this.hits = {}
  }

  incrementOnKey(key) {
    this.hits[key] = this.hits[key] ? this.hits[key] + 1 : 1
    clearInterval(this.interval)
    this.interval = setInterval(() => this.resetStore(), this.timeWindowMs)
    return this.hits[key]
  }

  close() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }
}
