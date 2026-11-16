// Archetype check for a fastify plugin: importing the package isn't enough —
// it has to actually register on a real Fastify instance and serve a request.
// Runs inside the smoke consumer, against the INSTALLED package (see smoke.mjs).
import Fastify from 'fastify'
import slowDown from 'fastify-slow-down'

const app = Fastify()
await app.register(slowDown)
app.get('/', async () => 'ok')

const res = await app.inject({ method: 'GET', url: '/' })
await app.close()

if (res.statusCode !== 200) {
  console.error(`unexpected status ${res.statusCode}`)
  process.exit(1)
}
console.log('registered + served OK')
