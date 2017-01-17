import jetpack from 'fs-jetpack'
import pool from 'generic-pool'

export function readDatabase (instance) {
  let client

  // eslint-disable-next-line prefer-let/prefer-let
  const SQL = require('sql.js')

  let atPath = instance.options.connection.filename
  if (jetpack.exists(atPath) === 'file') {
    let file = jetpack.read(atPath, 'buffer')
    client = new SQL.Database(file)
  } else {
    client = new SQL.Database()
    writeDatabase(instance, client)
  }

  return client
}

export function writeDatabase (instance, db) {
  let data = db.export()
  let buffer = new Buffer(data)

  jetpack.file(instance.options.connection.filename, {
    content: buffer, mode: '777'
  })
}

export function connect (instance) {
  return pool.createPool({
    create () {
      return Promise.resolve(readDatabase(instance))
    },

    destroy (client) {
      client.close()
      return Promise.resolve()
    }
  }, { min: 1, max: 1 })
}
