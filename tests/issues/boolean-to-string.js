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
  let x = `insert into "booleans" ("booleanField", "key") values ('true', 'one')`
  db.verbose = y => t.is(y, x)

  await db.insert('booleans', { key: 'one', booleanField: true })
})

test.serial('coerces booleans to strings on update', async t => {
  let x = `update "booleans" set "booleanField" = 'false' where "key" = 'one'`
  db.verbose = y => t.is(y, x, 'works for object syntax')

  await db.update('booleans', { booleanField: false }, { key: 'one' })

  let z = `update "booleans" set "booleanField" = 'true' where "key" = 'one'`
  db.verbose = y => t.is(y, z, 'works for array syntax')

  await db.update('booleans', ['booleanField', true], { key: 'one' })
})

test.serial('returns boolean strings to boolean on selection', async t => {
  await db.insert('booleans', { key: 'two', booleanField: false })

  let res = await db.getValue('booleans.booleanField', { key: 'two' })
  t.is(res, false)
})

test.serial('does not coerce booleans when `options.coercion` is set to false', async t => {
  db.coercion = false

  let x = `update "booleans" set "booleanField" = 1 where "key" = 'two'`
  db.verbose = y => t.is(y, x, 'true becomes 1')

  await db.update('booleans', { booleanField: true }, { key: 'two' })

  let z = `update "booleans" set "booleanField" = 0 where "key" = 'two'`
  db.verbose = y => t.is(y, z, 'false becomes 0')

  await db.update('booleans', { booleanField: false }, { key: 'two' })

  db.coercion = true
})
