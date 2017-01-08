import Trilogy from '../dist/trilogy'

import test from 'ava'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

test.before('insert default data', async () => {
  await db.model('data', {
    item: String,
    price: String
  })

  await db.create('data', { item: 'freedom', price: 'not free' })
})

test('successfully reads in an existing file', async t => {
  let res = await db.get('data.price', { item: 'freedom' })
  t.is(res, 'not free')
})
