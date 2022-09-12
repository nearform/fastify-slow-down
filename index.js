'use strict'

import fp from 'fastify-plugin'
import * as fromUtils from './lib/utils'

/**
 * How it's working:
 * Keep in memory the records by key {"x": 2 , "y": 1, "keyExtractor": count}
 * when the limit is reached by record start to delay the response with delayMs (ms)
 * reset to default records when after keepInMemoryMS API inactivity
 */
async function slowDownPlugin(fastify, settings) {
  const pluginSettings = fromUtils.provideDefaultOptions(settings)

  const run = Symbol('slow-down-did-run')
  pluginSettings.run = run
  fastify.decorateRequest(run, false)
  if (!fastify.hasDecorator('slowDown')) {
    fastify.decorate('slowDown', options => {
      const params = fromUtils.applyOptions(options, pluginSettings)
      return fromUtils.slowDownRequestHandler(
        params.keepInMemoryMS !== pluginSettings.keepInMemoryMS
          ? fromUtils.provideDefaultOptions(params)
          : params
      )
    })
  }
  fastify.addHook('onRoute', routeOptions => {
    if (
      routeOptions.config &&
      typeof routeOptions.config.slowDown !== 'undefined'
    ) {
      const pluginSettings = fromUtils.applyOptions(
        routeOptions.config.slowDown
      )
      fromUtils.makeRouteSlowDown(pluginSettings, routeOptions)
    } else {
      throw new Error('Unknown value for route rate-limit configuration')
    }
  })
}

module.exports = fp(slowDownPlugin, {
  fastify: '4.x',
  name: '@nearform/slow-down'
})
