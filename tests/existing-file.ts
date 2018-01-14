import test from 'ava'
import { join, basename } from 'path'

import { create } from '../src'

const filePath = join(__dirname, `${basename(__filename, '.ts')}.db`)
const db = create(filePath)

test.before('insert default data', async () => {
  await db.model('data', {
    item: String,
    price: String
  })

  await db.create('data', { item: 'freedom', price: 'not free' })
})

test('successfully reads in an existing file', async t => {
  const res = await db.get('data.price', { item: 'freedom' })
  t.is(res, 'not free')
})
