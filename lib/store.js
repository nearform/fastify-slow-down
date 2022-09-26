export class Store {
  constructor(timeWindowMs) {
    this.timeWindowMs = timeWindowMs
    this.resetStore()
  }

  resetStore() {
    this.hits = {}
  }

  incrementKey(key) {
    if (!(key in this.hits)) {
      this.hits[key] = { counter: 0 }
    }
    this.hits[key].counter++
    if (this.hits[key].timeout === undefined) {
      this.hits[key].timeout = setTimeout(
        () => this.resetKey(key),
        this.timeWindowMs
      )
    }
  }

  resetKey(key) {
    clearTimeout(this.hits[key].timeout)
    delete this.hits[key]
  }

  incrementOnKey(key) {
    this.incrementKey(key)
    return this.hits[key].counter
  }

  close() {
    Object.values(this.hits).forEach(({ timeout }) => {
      clearTimeout(timeout)
    })
  }
}
