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
import slowDownPlugin from '../index.js'

const fastify = Fastify()

// register the plugin
fastify.register(slowDownPlugin)

// create a route
fastify.get('/', async (req, reply) => reply.send('Hello from Fastify!'))

// start server
fastify.listen({ port: 3000 }, err => {
  if (err) throw err
  console.log('Server: http://localhost:3000')
})
```

The response will have some additional headers:

| Header | Description |
|--------|-------------|
|`x-slow-down-limit`     | how many requests the client can make until servers start to slow down the response
|`x-slow-down-remaining` | how many requests remain to the client in the timewindow
|`x-slow-down-delay` | the delayed is applied to this specific request