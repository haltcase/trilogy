import pool from 'generic-pool'
import { dirname } from 'path'
import { readFileSync, writeFileSync } from 'fs'

import { makeDirPath } from './util'

export function readDatabase (instance) {
  // eslint-disable-next-line prefer-let/prefer-let
  const SQL = require('sql.js')

  let client
  let { filename } = instance.options.connection

  if (filename === ':memory:') {
    return new SQL.Database()
  }

  try {
    makeDirPath(dirname(filename))
    let file = readFileSync(filename)
    client = new SQL.Database(file)
  } catch (e) {
    if (e.code === 'ENOENT') {
      client = new SQL.Database()
      writeDatabase(instance, client)
    } else {
      throw e
    }
  }

  return client
}

export function writeDatabase (instance, db) {
  let { filename } = instance.options.connection
  if (filename === ':memory:') return

  let data = db.export()
  let buffer = Buffer.from(data)

  makeDirPath(dirname(filename))
  writeFileSync(filename, buffer, { mode: parseInt('0777', 8) })
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
