import jetpack from 'fs-jetpack'
import SQL from 'sql.js'

import constants from './constants'

export function readDatabase (instance) {
  let atPath = instance.options.connection.filename
  if (jetpack.exists(atPath) === 'file') {
    let file = jetpack.read(atPath, 'buffer')
    instance.db = new SQL.Database(file)
  } else {
    instance.db = new SQL.Database()
    writeDatabase(instance)
  }
}

export function writeDatabase (instance) {
  if (!instance.db) {
    throw new Error(constants.ERR_NO_DATABASE)
  }

  try {
    let data = instance.db.export()
    let buffer = new Buffer(data)

    let atPath = instance.options.connection.filename

    jetpack.file(atPath, {
      content: buffer, mode: '777'
    })
  } catch (e) {
    throw new Error(e.message)
  }
}
