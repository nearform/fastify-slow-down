import { test } from 'tap'

import { Store } from '../lib/store.js'

test('the store decrementOnKey method should have no effect if the key is not set or is already zero', async t => {
  const store = new Store(10000, 1000)
  const key = 'key'

  store.decrementOnKey(key)
  store.incrementOnKey(key)
  const { counter: firstResult } = store.incrementOnKey(key)

  t.equal(firstResult, 2)

  store.decrementOnKey(key)
  store.decrementOnKey(key)
  store.decrementOnKey(key)
  store.decrementOnKey(key)
  const { counter: secondResult } = store.incrementOnKey(key)

  t.equal(secondResult, 1)
})
