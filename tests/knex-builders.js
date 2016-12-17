import Trilogy from '../dist/trilogy'

import test from 'ava'
import { remove } from 'fs-jetpack'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

test.after.always('remove test database file', () => remove(filePath))

test('.schemaBuilder exposes the knex schema builder', t => {
  t.is(typeof db.schemaBuilder.createTable, 'function')

  let expected = `create table "test" ("hello" varchar(255), "world" varchar(255))`
  let res = db.schemaBuilder.createTable('test', table => {
    table.string('hello')
    table.string('world')
  }).toString()

  t.is(res, expected)
})

test('.queryBuilder exposes the knex query builder', t => {
  t.is(typeof db.queryBuilder.select, 'function')

  let expected = `select "foo" where "age" > 21 and "name" = 'Jerry'`
  let res = db.queryBuilder
    .select('foo')
    .where('age', '>', 21)
    .andWhere({ name: 'Jerry' })
    .toString()

  t.is(res, expected)
})
