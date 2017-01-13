import Trilogy from '../dist/trilogy'

import test from 'ava'
import { remove } from 'fs-jetpack'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

test.after.always('remove test database file', () => {
  return db.close().then(() => remove(filePath))
})

test('.knex exposes the knex query builder', t => {
  t.is(typeof db.knex.select, 'function')

  let expected = `select "foo" where "age" > 21 and "name" = 'Jerry'`
  let res = db.knex
    .select('foo')
    .where('age', '>', 21)
    .andWhere({ name: 'Jerry' })
    .toString()

  t.is(res, expected)
})
