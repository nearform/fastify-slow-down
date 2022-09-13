import { resetExpireTime } from './utils.js'

export class Store {
  constructor(timeWindowMs) {
    this.hits = {}
    this.timeWindowMs = timeWindowMs
    this.expireTime = resetExpireTime(timeWindowMs)

    this.interval = setInterval(() => {
      this.hits = {}
      this.expireTime = resetExpireTime(timeWindowMs)
    }, timeWindowMs)
  }

  incrementOnKey(key) {
    this.hits[key] = this.hits[key] ? this.hits[key] + 1 : 1
    this.expireTime = resetExpireTime(this.timeWindowMs)
    clearInterval(this.interval)
    this.interval = setInterval(() => {
      this.hits = {}
      this.expireTime = resetExpireTime(this.timeWindowMs)
    }, this.timeWindowMs)
    return this.hits[key]
  }
}
