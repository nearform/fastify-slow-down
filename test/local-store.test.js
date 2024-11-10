import { test } from 'node:test'

import { LocalStore } from '../lib/localStore.js'

test('the store getValue method should return current counter for a given key', async t => {
  const store = new LocalStore(10_000, 1000)
  const key = 'key'
  store.incrementOnKey(key)
  const { counter } = store.getValue(key)
  t.assert.equal(counter, 1)
})

test('the store getValue method should return default counter for a given key if the key is not set', async t => {
  const store = new LocalStore(10_000, 1000)
  const key = 'key'
  const { counter } = store.getValue(key)
  t.assert.equal(counter, 0)
})

test('the store decrementOnKey method should have no effect if the key is not set or is already zero', async t => {
  const store = new LocalStore(10_000, 1000)
  const key = 'key'

  store.decrementOnKey(key)
  store.incrementOnKey(key)
  const { counter: firstResult } = store.getValue(key)

  t.assert.equal(firstResult, 1)

  store.decrementOnKey(key)
  store.decrementOnKey(key)
  store.decrementOnKey(key)
  store.decrementOnKey(key)
  const { counter: secondResult } = store.getValue(key)

  t.assert.equal(secondResult, 0)
})
