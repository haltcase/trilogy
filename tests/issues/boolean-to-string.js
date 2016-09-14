import Trilogy from '../../dist/trilogy'

import test from 'ava'
import { basename } from 'path'
import { remove } from 'fs-jetpack'

const filePath = `${basename(__filename, '.js')}.db`
const db = new Trilogy(filePath)

test.before(async () => {
  await db.createTable('booleans', ['key', 'booleanField'])
})

test.after.always('remove test database file', () => remove(filePath))

test.serial('coerces booleans to strings on insert', async t => {
  const x = `insert into "booleans" ("booleanField", "key") values ('true', 'one')`
  db.verbose = y => t.is(y, x)

  await db.insert('booleans', { key: 'one', booleanField: true })
})

test.serial('coerces booleans to strings on update', async t => {
  const x = `update "booleans" set "booleanField" = 'false' where "key" = 'one'`
  db.verbose = y => t.is(y, x, 'works for object syntax')

  await db.update('booleans', { booleanField: false }, { key: 'one' })

  const z = `update "booleans" set "booleanField" = 'true' where "key" = 'one'`
  db.verbose = y => t.is(y, z, 'works for array syntax')

  await db.update('booleans', ['booleanField', true], { key: 'one' })
})

test.serial('returns boolean strings to boolean on selection', async t => {
  await db.insert('booleans', { key: 'two', booleanField: false })

  const res = await db.getValue('booleans.booleanField', { key: 'two' })
  t.is(res, false)
})
