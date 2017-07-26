import test from 'ava'
import Trilogy from '../dist/trilogy'

const db = new Trilogy(':memory:')

test.after.always(() => db.close())

test('.knex exposes the knex query builder', t => {
  t.is(typeof db.knex.select, 'function')

  const expected = `select "foo" where "age" > 21 and "name" = 'Jerry'`
  const res = db.knex
    .select('foo')
    .where('age', '>', 21)
    .andWhere({ name: 'Jerry' })
    .toString()

  t.is(res, expected)
})
