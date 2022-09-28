import { test } from 'tap'
import FakeTimers from '@sinonjs/fake-timers'
import { Store } from '../lib/store.js'
import { DEFAULT_OPTIONS } from '../lib/constants.js'
import { convertToMs } from '../lib/helpers.js'
import { slowDownAPI } from './helpers.js'

test('it should delete expired keys with a given interval', async t => {
  const clock = FakeTimers.install()
  const store = new Store(
    convertToMs(DEFAULT_OPTIONS.timeWindow),
    convertToMs(DEFAULT_OPTIONS.evictionInterval),
    DEFAULT_OPTIONS.inMemoryCacheSize
  )
  await slowDownAPI(DEFAULT_OPTIONS.delayAfter, () => store.incrementOnKey('1'))

  await store.incrementOnKey('2')
  clock.tick(
    convertToMs(DEFAULT_OPTIONS.evictionInterval) -
      convertToMs(DEFAULT_OPTIONS.timeWindow) / 3
  )
  await store.incrementOnKey('1')
  clock.tick(convertToMs(DEFAULT_OPTIONS.timeWindow) / 3)
  t.strictSame(store.cache.keys(), ['1'])
})
