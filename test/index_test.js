import Trilogy from '../dist/trilogy'

import { exists, remove } from 'fs-jetpack'
import { resolve } from 'path'
import chai from 'chai'
import asPromised from 'chai-as-promised'

chai.should()
chai.use(asPromised)

const filePath = resolve(__dirname, '..', 'fixtures', 'test.db')
const existing = resolve(__dirname, '..', 'fixtures', 'file.db')

describe('trilogy', () => {
  let db = null
  let store = null

  before('ensure existing file exists for existence test :)', async () => {
    if (exists(existing) === 'file') {
      store = new Trilogy(existing)
    } else {
      store = new Trilogy(existing)

      await store.createTable('data', [
        { name: 'item' }, { name: 'price' }
      ])

      await store.insert('data', { item: 'freedom', price: 'not free' })
    }
  })

  it('throws if no file path is provided', () => {
    (() => new Trilogy()).should.throw(Error)
  })

  it('successfully creates a new file', () => {
    db = new Trilogy(filePath)
    exists(filePath).should.equal('file')
  })

  it('successfully reads in an existing file', () => {
    return store.getValue('data.price', {
      item: 'freedom'
    }).should.eventually.equal('not free')
  })

  describe('#createTable()', () => {
    it('adds a table to the database', async () => {
      await db.createTable('people', [
        { name: 'name' },
        { name: 'age', type: 'integer' }
      ])

      return db.hasTable('people').should.eventually.equal(true)
    })
  })

  describe('#hasTable()', () => {
    const columns = [
      { name: 'first' },
      { name: 'second', type: 'integer' }
    ]

    const tables = [
      { name: 'one', columns },
      { name: 'two', columns },
      { name: 'three', columns }
    ]

    before(() => {
      tables.forEach(table => {
        db.createTable(table.name, table.columns)
      })
    })

    it('returns true for existing tables', () => {
      return Promise.all(tables.map(table => {
        db.hasTable(table.name).should.become(true)
      }))
    })

    it('returns false for non-existent tables', async () => {
      const noTables = ['four', 'five', 'six']

      return Promise.all(noTables.map(table => {
        return db.hasTable(table).should.become(false)
      }))
    })
  })

  describe('#insert()', () => {
    after(async () => await db.del('one', { first: 'hello' }))

    it('inserts values into the database', async () => {
      const inserts = [
        { name: 'one', value: { first: 'hello', second: 1 } },
        { name: 'two', value: { first: 'hello', second: 2 } },
        { name: 'three', value: { first: 'hello', second: 3 } }
      ]

      await Promise.all(inserts.map(insert => {
        return db.insert(insert.name, insert.value)
      }))

      return Promise.all(inserts.map(insert => {
        return db.select(insert.name, insert.value)
                 .should.eventually.deep.equal([insert.value])
      }))
    })
  })

  describe('#select()', () => {
    it('retrieves rows as arrays of objects', async () => {
      const names = ['fee', 'fi', 'fo']

      names.map(async name => {
        await db.insert('one', { first: name, second: 'blah' })
      })

      const res = await db.select('one')

      res.should.be.an('array')
      res.forEach((obj, i) => {
        obj.should.be.an('object')
        obj.should.have.all.keys('first', 'second')
        obj.first.should.equal(names[i])
      })
    })
  })

  describe('#first()', () => {
    it('retrieves a single row as an object', async () => {
      const res = await db.first('one')

      res.should.be.an('object').with.all.keys('first', 'second')
    })
  })

  describe('#getValue()', () => {
    it('retrieves a single column\'s value', () => {
      return db.getValue('one.second', { first: 'fee' })
               .should.eventually.become('blah')
    })

    it('returns undefined if key does not exist', () => {
      return Promise.all([
        db.getValue('one.second', { first: 'worst' })
          .should.eventually.become(undefined),
        db.getValue('one.third', { first: 'fee' })
          .should.eventually.become(undefined)
      ])
    })
  })

  describe('#update()', () => {
    after(async () => {
      await store.update('data', { price: 'not free' }, { item: 'freedom' })
    })

    it('changes the value of an existing key', async () => {
      await store.update('data', { price: 'free' }, { item: 'freedom' })
      return store.getValue('data.price', { item: 'freedom' })
               .should.eventually.equal('free')
    })
  })

  describe('#increment()', () => {
    const people = [
      { name: 'Dale', age: 30 },
      { name: 'Lelu', age: 6 },
      { name: 'Gurlak', age: 302 }
    ]

    before(() => {
      people.forEach(async person => await db.insert('people', person))
    })

    it('increments a specific number value by 1', () => {
      return Promise.all(people.map(async ({ name, age }, i) => {
        people[i].age += 1
        await db.increment('people.age', { name })

        return db.getValue('people.age', { name })
                 .should.eventually.equal(age + 1)
      }))
    })

    it('increments a specific number value by specified amount', () => {
      return Promise.all(people.map(async ({ name, age }) => {
        await db.increment('people.age', 7, { name })

        return db.getValue('people.age', { name })
                 .should.eventually.equal(age + 7)
      }))
    })
  })

  describe('#decrement()', () => {
    const people = [
      { name: 'Lara', age: 20 },
      { name: 'Spyro', age: 18 },
      { name: 'Benjamin Button', age: 100 }
    ]

    before(() => {
      people.forEach(async person => await db.insert('people', person))
    })

    it('decrements a specific value by 1', async () => {
      return Promise.all(people.map(async ({ name, age }, i) => {
        people[i].age -= 1
        await db.decrement('people.age', { name })

        return db.getValue('people.age', { name })
                 .should.eventually.equal(age - 1)
      }))
    })

    it('decrements a specific number value by a specified amount', async () => {
      return Promise.all(people.map(async ({ name, age }, i) => {
        people[i].age -= 4
        await db.decrement('people.age', 4, { name })

        return db.getValue('people.age', { name })
                 .should.eventually.equal(age - 4)
      }))
    })

    it(`doesn't allow negative values when allowNegative is false`, async () => {
      await db.decrement('people.age', 200, {
        name: 'Benjamin Button'
      })

      return db.getValue('people.age', {
        name: 'Benjamin Button'
      }).should.eventually.equal(0)
    })

    it('allows negative values when allowNegative is true', async () => {
      await db.decrement('people.age', {
        name: 'Benjamin Button'
      }, true)

      return db.getValue('people.age', {
        name: 'Benjamin Button'
      }).should.eventually.equal(-1)
    })
  })

  describe('#del()', () => {
    const somePeople = ['Dale', 'Lelu', 'Gurlak']
    const morePeople = ['Lara', 'Spyro', 'Benjamin Button']

    it('removes a row from the specified table', async () => {
      somePeople.forEach(async person => {
        await db.del('people', { name: person })
        const res = await db.first('people', { name: person })
        res.should.not.exist()
      })
    })

    it('removes all rows from the specified table', async () => {
      await db.del('people')

      morePeople.forEach(async person => {
        const res = await db.first('people', { name: person })
        res.should.not.exist()
      })
    })
  })

  describe('#count()', () => {
    const people = [
      { name: 'Lara', age: 20 },
      { name: 'Spyro', age: 18 },
      { name: 'Kratos', age: 11 }
    ]

    before(() => {
      people.forEach(async person => await db.insert('people', person))
    })

    it('returns the total number of rows', () => {
      return db.count('people').should.eventually.equal(3)
    })

    it('returns the number of matching rows', () => {
      return db.count('people', ['age', '<', '20'])
               .should.eventually.equal(2)
    })
  })

  after(() => remove(filePath))
})
