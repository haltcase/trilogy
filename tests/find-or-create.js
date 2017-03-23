import Trilogy from '../dist/trilogy'

import test from 'ava'
import rimraf from 'rimraf'
import { join, basename } from 'path'

const filePath = join(__dirname, `${basename(__filename, '.js')}.db`)
const db = new Trilogy(filePath)

const makeInput = date => ({ name: 'Overwatch', last_played: date, genre: 'FPS' })

test.before(async () => {
  await db.model('games', {
    name: { type: String, primary: true },
    last_played: Date,
    genre: String
  })
})

test.after.always('remove test database file', () => {
  return db.close().then(() => rimraf.sync(filePath))
})

test('creates missing objects or returns an existing one', async t => {
  t.is(await db.count('games', { genre: 'FPS' }), 0)

  let first = makeInput(new Date('Jan 31, 2017'))
  let fresh = await db.findOrCreate('games', first)
  t.is(await db.count('games', { genre: 'FPS' }), 1)

  let duplicate = makeInput(new Date('Feb 2, 2017'))
  let existing = await db.findOrCreate('games', duplicate)
  t.deepEqual(fresh, existing)
  t.is(await db.count('games', { genre: 'FPS' }), 1)

  t.is(fresh.last_played, existing.last_played)
})

