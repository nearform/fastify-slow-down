![CI](https://github.com/nearform/bench-template/actions/workflows/ci.yml/badge.svg?event=push)

A slow down plugin for fastify

## Installation

```bash
npm i fastify-slow-down
```

## Usage

Register SlowDown as a Fastify plugin.
This plugin will add an `onRequest` hook to slow down replies if a client (based on their IP address by default) has made too many multiple requests in the given `timeWindow` and
it will add `slowDown` request decorator, which is an object with the following properties:

| Name      | Type                | Description                                                              |
| --------- | ------------------- | ------------------------------------------------------------------------ |
| limit     | number              | the maximum limit until the server starts to delay the response          |
| current   | number              | the index of the current request                                         |
| remaining | number              | how many requests are left until the server starts to delay the response |
| delay     | number \| undefined | value of the delay (in milliseconds) applied to this request             |

```js
import Fastify from 'fastify'
import slowDownPlugin from 'fastify-slow-down'

const fastify = Fastify()

// register the plugin
fastify.register(slowDownPlugin)

// create a route
fastify.get('/', async () => 'Hello from fastify-slow-down!')

// start server
await fastify.listen({ port: 3000 })
```

The response will have some additional headers:

| Header                  | Description                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------ |
| `x-slow-down-limit`     | how many requests in total the client can make until the server starts to slow down the response |
| `x-slow-down-remaining` | how many requests remain to the client in the `timeWindow`                                       |
| `x-slow-down-delay`     | how much delay (in milliseconds) has been applied to this request                                |

## Configuration

| Name              | Type              | Default Value   | Description                                                                                                                                                                                                                                    |
| ----------------- | ----------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| delay             | string \| number  | 1 second        | Base unit of time delay applied to requests. It can be expressed in milliseconds or as string in [`ms`](https://github.com/zeit/ms) format. Set to `0` to disable delaying.                                                                    |
| delayAfter        | number            | 5               | number of requests received during `timeWindow` before starting to delay responses. Set to `0` to disable delaying.                                                                                                                            |
| maxDelay          | string, number    | Infinity        | the maximum value of delay that a request has after many consecutive attempts. It is an important option for the server when it is running behind a load balancer or reverse proxy, and has a request timeout. Set to `0` to disable delaying. |
| timeWindow        | string \|, number | 30 seconds      | The duration of the time window during which request counts are kept in memory. It can be expressed in milliseconds or as a string in [`ms`](https://github.com/zeit/ms) format. Set to `0` to disable delaying.                               |
| inMemoryCacheSize | number            | 5000            | The maximum number of items that will be stored in the in-memory cache _(this plugin internally uses a lru cache to handle the clients, you can change the size of the cache with this option)_                                                |
| evictionInterval  | number \| string  | 15 minutes      | The duration of the interval that will clear out the cache from the expired keys                                                                                                                                                               |
| headers           | boolean           | true            | flag to add custom headers `x-slow-down-limit`, `x-slow-down-remaining`, `x-slow-down-delay` for all server responses.                                                                                                                         |
| keyGenerator      | function          | (req) => req.ip | Function used to generate keys to uniquely identify requests coming from the same user                                                                                                                                                         |

## Example with configuration

Registering the plugin with these options:

```js
fastify.register(slowDownPlugin, {
  delay: '10 seconds',
  delayAfter: 10,
  timeWindow: '10 minutes',
  maxDelay: '100 seconds'
})
```

A delay specified via the `delay` option will be applied to requests coming from the same IP address (by default) when more than `delayAfter` requests are received within the time specified in the `timeWindow` option.

In 10 minutes the result of hitting the API will be:

- 1st request - no delay
- 2nd request - no delay
- 3rd request - no delay
- `...`
- 10th request - no delay
- 11th request - 10 seconds delay
- 12th request - 20 seconds delay
- 13th request - 30 seconds delay
- `...`
- 20th request - 100 seconds delay
- 21st request - 100 seconds delay\*

After 10 minutes without hitting the API the results will be:

- 21th request - no delay
- 21th request - no delay
- `...`
- 30th request - no delay
- 31th request - 10 seconds delay

\*Delay remains the same because the value of `maxDelay` option is `100 seconds`
