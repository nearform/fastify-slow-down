![CI](https://github.com/nearform/bench-template/actions/workflows/ci.yml/badge.svg?event=push)

A slow down plugin for fastify

## Usage
Register the plugin.<br>
This plugin will add an `onRequest` hook to slow down if a client (based on their IP address) has made too multiple requests in the given timeWindow.
```js
import Fastify from 'fastify'
import slowDownPlugin from '../index.js'

const fastify = Fastify()

// register the plugin
fastify.register(slowDownPlugin)

// create a route
fastify.get('/', async (req, reply) => reply.send('tap test!'))

// start server
fastify.listen({ port: 3000 }, err => {
  if (err) throw err
  console.log('Server: http://localhost:3000')
})
```

The response will have some additional headers:

| Header | Description |
|--------|-------------|
|`x-slowdown-limit`     | how many requests the client can make until servers start to slow down the response
|`x-slowdown-remaining` | how many requests remain to the client in the timewindow
|`x-slowdown-delay` | the actual delay applied to the client for the request