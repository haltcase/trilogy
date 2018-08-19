import test from 'ava'
import { create } from '../src'

const db = create(':memory:')

test.after.always(() => db.close())

test('creates a new model definition', async t => {
  await db.model('teams', {
    name: String,
    playoffs: { type: Boolean, defaultTo: false }
  })

  t.true(await db.hasModel('teams'))
})

test('defines a model with a uniquely constrained property', async t => {
  await db.model('sodas', {
    name: { type: String, unique: true },
    flavor: String
  })

  const object = { name: 'coke', flavor: 'awesome' }
  await db.create('sodas', object)
  await db.create('sodas', object)

  t.is(await db.count('sodas', { name: 'coke' }), 1)
})

test('defines a model with a single named index', async t => {
  await db.model('sodas2', {
    name: { type: String, index: 'idx_name' },
    flavor: String
  })

  const query = db.knex.raw('SELECT * FROM sqlite_master WHERE type = "index"')
  const results = await db.raw(query, true)
  const def = results.filter((item: any) => item.tbl_name === 'sodas2')
  t.is(def[0].sql, 'CREATE INDEX `idx_name` on `sodas2` (`name`)')
})

test('defines a model with multiple indices', async t => {
  const schema = {
    name: String,
    flavor: String
  }

  await db.model('sodas_single', schema, {
    index: 'name'
  })

  await db.model('sodas_array', schema, {
    index: [
      ['name', 'flavor'],
      ['flavor', 'name']
    ]
  })

  await db.model('sodas_object', schema, {
    index: {
      idx_name_flvr: ['name', 'flavor'],
      idx_flvr_name: ['flavor', 'name']
    }
  })

  const query = db.knex.raw('SELECT * FROM sqlite_master WHERE type = "index"')
  const results = await db.raw(query, true)

  const single = results.find((item: any) => item.tbl_name === 'sodas_single')
  t.is(single.sql, 'CREATE INDEX `sodas_single_name_index` on `sodas_single` (`name`)')

  const array = results.filter((item: any) => item.tbl_name === 'sodas_array')
  t.is(
    array[0].sql,
    'CREATE INDEX `sodas_array_name_flavor_index` on `sodas_array` (`name`, `flavor`)'
  )
  t.is(
    array[1].sql,
    'CREATE INDEX `sodas_array_flavor_name_index` on `sodas_array` (`flavor`, `name`)'
  )

  const object = results.filter((item: any) => item.tbl_name === 'sodas_object')
  t.is(object[0].sql, 'CREATE INDEX `idx_name_flvr` on `sodas_object` (`name`, `flavor`)')
  t.is(object[1].sql, 'CREATE INDEX `idx_flvr_name` on `sodas_object` (`flavor`, `name`)')
})
