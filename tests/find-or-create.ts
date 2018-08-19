import test from 'ava'
import { connect } from '../src'

import { Game } from './helpers/types'

const db = connect(':memory:')

const makeInput = (date: Date) => ({ name: 'Overwatch', last_played: date, genre: 'FPS' })

test.after.always(() => db.close())

test('creates missing objects or returns an existing one', async t => {
  const games = await db.model<Game>('games', {
    name: { type: String, primary: true },
    last_played: Date,
    genre: String
  })

  t.is(await games.count({ genre: 'FPS' }), 0)

  const first = makeInput(new Date('Jan 31, 2017'))
  const fresh = await games.findOrCreate(first)
  t.is(await games.count({ genre: 'FPS' }), 1)

  const duplicate = makeInput(new Date('Feb 2, 2017'))
  const existing = await games.findOrCreate(duplicate)
  t.deepEqual(fresh, existing)
  t.is(await games.count({ genre: 'FPS' }), 1)

  t.is(fresh.last_played, existing.last_played)
})
