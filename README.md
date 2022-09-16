![CI](https://github.com/nearform/bench-template/actions/workflows/ci.yml/badge.svg?event=push)

A slow down plugin for fastify

## Installation

```bash
npm i fastify-slow-down
```

## Usage
Register the plugin.
This plugin will add an `onRequest` hook to slow down replies if a client (based on their IP address) has made too many multiple requests in the given `timeWindow`.
```js
import Fastify from 'fastify'
import slowDownPlugin from 'fastify-slow-down'

const fastify = Fastify()

// register the plugin
fastify.register(slowDownPlugin)

// create a route
fastify.get('/', async (req, reply) => reply.send('Hello fastify-slow-down!'))

// start server
await fastify.listen({ port: 3000 })
```

The response will have some additional headers:

| Header | Description |
|--------|-------------|
|`x-slow-down-limit`     | how many requests in total the client can make until the server starts to slow down the response
|`x-slow-down-remaining` | how many requests remain to the client in the `timeWindow`
|`x-slow-down-delay` | the delayed is applied to this specific request
|`x-slow-down-closed` | if the request is closed, this header is applied