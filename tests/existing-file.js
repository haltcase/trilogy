import Trilogy from '../dist/trilogy'

import test from 'ava'
import { basename } from 'path'

const filePath = `${basename(__filename, '.js')}.db`
const db = new Trilogy(filePath)

test.before('insert default data', async () => {
  await db.createTable('data', [
    { name: 'item' }, { name: 'price' }
  ])

  await db.insert('data', { item: 'freedom', price: 'not free' })
})

test('successfully reads in an existing file', async t => {
  let res = await db.getValue('data.price', { item: 'freedom' })
  t.is(res, 'not free')
})
