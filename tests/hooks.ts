import test from 'ava'
import { connect } from '../src'

import { User } from './helpers/types'

const onlyNonInternalRegex =
  /^\s*INSERT OR IGNORE into `objects` \(`name`\) values \('desk'\)/

const expectations = [
  /^\s*create table if not exists objects_returning_temp/,
  /^\s*create trigger if not exists on_insert_objects/,
  onlyNonInternalRegex,
  /^\s*select \* from `objects_returning_temp` limit 1/,
  /^\s*drop table if exists objects_returning_temp/,
  /^\s*drop trigger if exists on_insert_objects/
]

test('hooks.onQuery: receives executed queries (internal as option)', async t => {
  const db = connect(':memory:')

  const objects = await db.model('objects', {
    name: String
  })

  const internalCheck = () => {
    let i = 0
    return (query: string) =>
      t.regex(query, expectations[i++])
  }

  const defaultCheck = (query: string) => {
    t.regex(query, onlyNonInternalRegex)
  }

  const options = { includeInternal: true }

  // include internal trilogy queries
  const unsub1 = db.onQuery('objects', internalCheck(), options)
  const unsub2 = objects.onQuery(internalCheck(), options)

  // do not include internal trilogy queries (default)
  const unsub3 = objects.onQuery(defaultCheck)
  const unsub4 = db.onQuery('objects', defaultCheck)

  await objects.create({ name: 'desk' })

  unsub1()
  unsub2()
  unsub3()
  unsub4()

  await objects.create({ name: 'lamp' })

  await db.close()
})

test('hooks.beforeCreate: receives the object to be created', async t => {
  const db = connect(':memory:')

  const users = await db.model<User>('users', {
    name: String,
    rank: { type: Number, set: (rank: number) => rank * 2 }
  })

  const unsub = users.beforeCreate(user => {
    t.is(user.name, 'citycide')
    t.is(user.rank, 10)
  })

  await users.create({
    name: 'citycide',
    rank: 10
  })

  unsub()

  await users.create({
    name: 'MR. ROBOT',
    rank: 999999999999
  })

  await db.close()
})

test('hooks.afterCreate: receives the object after its creation', async t => {
  const db = connect(':memory:')

  const users = await db.model<User>('users', {
    name: String,
    rank: { type: Number, set: (rank: number) => rank * 2 }
  })

  const unsub = users.afterCreate(user => {
    t.is(user.name, 'citycide')
    t.is(user.rank, 20)
  })

  await users.create({
    name: 'citycide',
    rank: 10
  })

  unsub()

  await users.create({
    name: 'MR. ROBOT',
    rank: 999999999999
  })

  await db.close()
})

test('hooks.beforeUpdate: receives upcoming changes & criteria', async t => {
  const db = connect(':memory:')

  const users = await db.model<User>('users', {
    name: String,
    rank: { type: Number, set: (rank: number) => rank * 2 }
  })

  await users.create({
    name: 'citycide',
    rank: 10
  })

  const unsub = users.beforeUpdate((changes, criteria) => {
    t.is(changes.rank, 100)

    t.deepEqual(criteria, { name: 'citycide' })
  })

  await users.update({ name: 'citycide' }, { rank: 100 })
  await users.set('rank', { name: 'citycide' }, 100)

  unsub()

  await db.close()
})

test('hooks.afterUpdate: receives updated objects', async t => {
  const db = connect(':memory:')

  const users = await db.model<User>('users', {
    name: String,
    rank: { type: Number, set: (rank: number) => rank * 2 }
  })

  await Promise.all([
    users.create({
      name: 'citycide',
      rank: 10
    }),
    users.create({
      name: 'anon',
      rank: 1
    })
  ])

  const unsub = users.afterUpdate((users, options) => {
    t.falsy(options.raw)
    t.is(users.length, 2)

    // setter on users.rank has fired, doubling the rank
    t.deepEqual(users, [
      { name: 'citycide', rank: 200 },
      { name: 'anon', rank: 200 }
    ])
  })

  await users.update(['rank', '>=', 0], { rank: 100 })

  unsub()

  await db.close()
})

test('hooks.beforeRemove: receives criteria for objects to be removed', async t => {
  const db = connect(':memory:')

  const users = await db.model<User>('users', {
    name: String,
    rank: Number
  })

  const unsub = users.beforeRemove(criteria => {
    if (!Array.isArray(criteria)) {
      t.is(criteria.name, 'citycide')
    } else {
      t.deepEqual(criteria, ['rank', '<', 50])
    }
  })

  await users.remove({ name: 'citycide' })
  await users.remove(['rank', '<', 50])

  unsub()

  await db.close()
})

test('hooks.afterRemove: receives criteria for objects to be removed', async t => {
  const db = connect(':memory:')

  const users = await db.model<User>('users', {
    name: String,
    rank: Number
  })

  await Promise.all([
    users.create({
      name: 'citycide',
      rank: 10
    }),
    users.create({
      name: 'anon',
      rank: 1
    })
  ])

  const unsub = users.afterRemove(users => {
    t.deepEqual(users, [
      { name: 'citycide', rank: 10 },
      { name: 'anon', rank: 1 }
    ])
  })

  await users.remove(['rank', '<', 100])

  unsub()

  await db.close()
})
