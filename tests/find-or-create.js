import test from 'ava'
import Trilogy from '../dist/trilogy'

const db = new Trilogy(':memory:')

const makeInput = date => ({ name: 'Overwatch', last_played: date, genre: 'FPS' })

test.before(async () => {
  await db.model('games', {
    name: { type: String, primary: true },
    last_played: Date,
    genre: String
  })
})

test.after.always(() => db.close())

test('creates missing objects or returns an existing one', async t => {
  t.is(await db.count('games', { genre: 'FPS' }), 0)

  const first = makeInput(new Date('Jan 31, 2017'))
  const fresh = await db.findOrCreate('games', first)
  t.is(await db.count('games', { genre: 'FPS' }), 1)

  const duplicate = makeInput(new Date('Feb 2, 2017'))
  const existing = await db.findOrCreate('games', duplicate)
  t.deepEqual(fresh, existing)
  t.is(await db.count('games', { genre: 'FPS' }), 1)

  t.is(fresh.last_played, existing.last_played)
})
