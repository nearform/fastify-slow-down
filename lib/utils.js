'use strict'
import onFinished from 'on-finished'
import { Store } from './store'

const defaultOptions = {
  /**
   * maxUntilDelay: number
   * how many request until it is starting to delay the responses
   * default: 1
   */
  maxUntilDelay: 1,
  /**
   * dellayMs: number
   * miliseconds delay for response
   * default: 1
   */
  delayMs: 1000,
  /**
   * keepInMemoryMS: number
   * miliseconds to keep recodrs in memory
   * default 60000 (1 min)
   */
  keepInMemoryMS: 60000,
  /**
   * keyExtractor: function
   * generate an uniq custom key
   * default: user IP
   */
  keyExtractor: req => {
    return req.itkeyExtractor
  }
}

export const provideDefaultOptions = options => {
  let optionsWithDefaultValues = options || {
    store: new Store(defaultOptions.keepInMemoryMS)
  }
  Object.keys(defaultOptions).forEach(key => {
    if (typeof optionsWithDefaultValues[key] === 'undefined') {
      optionsWithDefaultValues[key] = defaultOptions[key]
    }
  })
  return optionsWithDefaultValues
}

export const resetExpireTime = ms => {
  const date = new Date()
  date.addMiliseconds(ms)
  return date
}

export const applyOptions = (routeOptions, pluginOptions) =>
  Object.assign({}, pluginOptions, routeOptions)

export const slowDownRequestHandler = options => {
  return async (req, res) => {
    const key = options.keyExtractor(req, res)
    options.store.incrementOnKey(key, (value, expireTime) => {
      const delay =
        value > options.maxUntilDelay
          ? (value - options.maxUntilDelay) * options.delayMs
          : 0
      req.slowDown = {
        limit: options.maxUntilDelay,
        value,
        remaining: Math.max(options.maxUntilDelay - value, 0),
        expireTime,
        delay
      }
      if (delay !== 0) {
        const timeoutId = setTimeout(() => res, delay)
        onFinished(req, () => () => clearTimeout(timeoutId))
      }
    })
  }
}

export const makeRouteSlowDown = async (params, routeOptions) => {
  const hook = params.hook || 'onRequest'
  const hookHandler = slowDownRequestHandler(params)
  if (Array.isArray(routeOptions[hook])) {
    routeOptions[hook].push(hookHandler)
  } else if (typeof routeOptions[hook] === 'function') {
    routeOptions[hook] = [routeOptions[hook], hookHandler]
  } else {
    routeOptions[hook] = [hookHandler]
  }
}
