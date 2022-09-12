'use strict'

import { resetExpireTime } from './utils'

export class Store {
  constructor(keepInMemoryMS) {
    this.hits = {}
    this.expireTime = resetExpireTime(keepInMemoryMS)

    this.interval = setInterval(() => {
      this.hits = {}
      this.expireTime = resetExpireTime(keepInMemoryMS)
    }, keepInMemoryMS)
    // @TODO release the interval on unmount or increment / decrement
  }

  incrementOnKey(key, cb) {
    this.hits[key] = this.hits[key] ? this.hits[key]++ : 1
    cb(this.hits[key], this.expireTime)
  }

  decrementOnKey(key) {
    this.hits[key] && this.hits[key]--
  }

  resetOnKey(key) {
    delete this.hits[key]
  }
}
