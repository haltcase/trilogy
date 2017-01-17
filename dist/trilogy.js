'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var knex = _interopDefault(require('knex'));
var path = require('path');
var type = _interopDefault(require('component-type'));
var osom = _interopDefault(require('osom'));
var jetpack = _interopDefault(require('fs-jetpack'));
var pool = _interopDefault(require('generic-pool'));

var map = function map(object, fn) {
  return each(object, fn, true);
};

function each(object, fn, map) {
  if (isObject(object)) {
    if (map) {
      var _ret = function () {
        var res = {};

        Object.keys(object).forEach(function (key) {
          res[key] = fn.call(object, object[key], key, object);
        });

        return {
          v: res
        };
      }();

      if (typeof _ret === "object") return _ret.v;
    } else {
      Object.keys(object).forEach(function (key) {
        fn.call(object, object[key], key, object);
      });
    }
  } else if (isArray(object)) {
    var method = map ? 'map' : 'forEach';
    return object[method](fn);
  } else {
    return object;
  }
}

function isOneOf(array, value) {
  return array.some(function (v) {
    return v === value;
  });
}

var isType = function isType(value, kind) {
  if (!kind) return type(value);
  return type(value) === kind.toLowerCase();
};

var isArray = function isArray(value) {
  return isType(value, 'array');
};
var isObject = function isObject(value) {
  return isType(value, 'object');
};
var isFunction = function isFunction(value) {
  return isType(value, 'function');
};
var isString = function isString(value) {
  return isType(value, 'string');
};
var isNumber = function isNumber(value) {
  return isType(value, 'number');
};


function invariant(condition, message) {
  if (!condition) {
    var error = new Error(message || 'Invariant Violation');
    error.name = 'InvariantError';
    error.framesToPop = 1;
    throw error;
  } else {
    return condition;
  }
}

var COLUMN_TYPES = ['increments', 'array', 'object', 'json', 'string', 'number', 'boolean', 'date'];

var KNEX_NO_ARGS = ['primary', 'unique', 'nullable', 'notNullable'];

function Any(value) {
  return value;
}

function toArray(value) {
  if (typeof value === 'undefined') return;
  return isArray(value) ? value : [value];
}

var setup = osom({
  client: {
    type: String,
    default: 'sqlite3',
    validate(value) {
      return value === 'sqlite3' || value === 'sql.js';
    }
  },
  dir: {
    type: String,
    default: process.cwd
  },
  connection: {
    type: Object,
    default: {},
    validate(value) {
      return isObject(value);
    }
  },
  verbose: {
    type: Any
  }
});

var modelOptions = osom({
  timestamps: Boolean,
  primary: Array,
  unique: Array
});

var findOptions = osom({
  order: Any,
  limit: Number,
  skip: Number
});

var aggregateOptions = osom({
  order: Any,
  groupBy: {
    type: Any,
    transform: [toArray]
  }
});

var columnDescriptor = osom({
  type: {
    type: Any,
    required: true,
    validate(value) {
      var type$$1 = isFunction(value) ? value.name : String(value);
      return isOneOf(COLUMN_TYPES, type$$1.toLowerCase());
    }
  },
  defaultTo: Any,
  unique: Boolean,
  primary: Boolean,
  nullable: Boolean,
  notNullable: Boolean,
  index: String
});

function toKnexSchema(model, options) {
  return function (table) {
    // every property of `model.schema` is a column
    each(model.schema, function (descriptor, name) {
      // each column's value is either its type or a descriptor
      var type$$1 = getDataType(descriptor);
      var partial = table[toKnexMethod(type$$1)](name);

      if (isFunction(descriptor) || !isObject(descriptor)) return;

      var columnProperties = columnDescriptor(descriptor);
      each(columnProperties, function (value, property) {
        if (isOneOf(['name', 'type'], property)) return;

        if (isOneOf(KNEX_NO_ARGS, property)) {
          columnProperties[property] && partial[property]();
        } else {
          partial[property](value);
        }
      });
    });

    each(options, function (value, key) {
      if (key === 'timestamps') {
        options.timestamps && table.timestamps(true, true);
      } else {
        table[key](value);
      }
    });
  };
}

// for insertions / updates
function toDefinition(model, object) {
  return map(object, function (value, column) {
    return toColumnDefinition(model, column, value);
  });
}

// for selects
function fromDefinition(model, object) {
  return map(object, function (value, column) {
    return fromColumnDefinition(model, column, value);
  });
}

// for insertions / updates
function toColumnDefinition(model, column, value) {
  var type$$1 = getDataType(model.schema[column]);
  return toInputType(type$$1, value);
}

// for selects
function fromColumnDefinition(model, column, value) {
  var type$$1 = getDataType(model.schema[column]);
  return toReturnType(type$$1, value);
}

function castValue(value) {
  var type$$1 = isType(value);
  if (type$$1 === 'number' || type$$1 === 'string') {
    return value;
  }

  if (type$$1 === 'boolean') return Number(value);

  if (type$$1 === 'array' || type$$1 === 'object') {
    return JSON.stringify(value);
  }

  return value;
}

function getDataType(property) {
  var type$$1 = property;

  if (isFunction(property)) {
    type$$1 = property.name;
  } else if (isObject(property)) {
    type$$1 = isFunction(property.type) ? property.type.name : property.type;
  }

  if (isString(type$$1)) {
    type$$1 = type$$1.toLowerCase();
  }

  if (!isOneOf(COLUMN_TYPES, type$$1)) {
    type$$1 = 'string';
  }

  return type$$1;
}

function toKnexMethod(type$$1) {
  switch (type$$1) {
    case 'string':
    case 'array':
    case 'object':
    case 'json':
      return 'text';
    case 'number':
    case 'boolean':
      return 'integer';
    case 'date':
      return 'dateTime';
    case 'increments':
    default:
      return type$$1;
  }
}

function toInputType(type$$1, value) {
  switch (type$$1) {
    case 'string':
      return String(value);
    case 'array':
    case 'object':
    case 'json':
      return JSON.stringify(value);
    case 'number':
    case 'boolean':
    case 'increments':
      return Number(value);
    case 'date':
      return new Date(value);
    default:
      return value;
  }
}

function toReturnType(type$$1, value) {
  switch (type$$1) {
    case 'string':
      return String(value);
    case 'array':
    case 'object':
    case 'json':
      return JSON.parse(value);
    case 'number':
    case 'increments':
      return Number(value);
    case 'boolean':
      return Boolean(value);
    case 'date':
      return new Date(value);
    default:
      return value;
  }
}

function readDatabase(instance) {
  var client = void 0;

  // eslint-disable-next-line prefer-let/prefer-let
  var SQL = require('sql.js');

  var atPath = instance.options.connection.filename;
  if (jetpack.exists(atPath) === 'file') {
    var file = jetpack.read(atPath, 'buffer');
    client = new SQL.Database(file);
  } else {
    client = new SQL.Database();
    writeDatabase(instance, client);
  }

  return client;
}

function writeDatabase(instance, db) {
  var data = db.export();
  var buffer = new Buffer(data);

  jetpack.file(instance.options.connection.filename, {
    content: buffer, mode: '777'
  });
}

function connect(instance) {
  return pool.createPool({
    create() {
      return Promise.resolve(readDatabase(instance));
    },

    destroy(client) {
      client.close();
      return Promise.resolve();
    }
  }, { min: 1, max: 1 });
}

function parseResponse(contents) {
  if (!contents || !contents.length) return [];

  var _contents$ = contents[0],
      columns = _contents$.columns,
      values = _contents$.values;

  var results = [];

  for (var i = 0; i < values.length; i++) {
    var line = {};

    for (var j = 0; j < columns.length; j++) {
      line[columns[j]] = values[i][j];
    }

    results.push(line);
  }

  return results;
}

function buildOrder(partial, order) {
  if (isString(order)) {
    if (order === 'random') {
      return partial.orderByRaw('RANDOM()');
    }
    return partial.orderBy(order);
  }

  if (isArray(order)) {
    var length = order.length;
    if (length === 1 || length === 2) {
      return partial.orderBy.apply(partial, order);
    }
  }

  return partial;
}

function buildWhere(partial, where) {
  var _isValidWhere = isValidWhere(where),
      isValid = _isValidWhere[0],
      arrayLength = _isValidWhere[1];

  if (!isValid) return partial;

  var cast = where;
  if (!arrayLength) {
    cast = map(where, castValue);
  } else {
    var i = arrayLength - 1;
    cast[i] = castValue(where[i]);
  }

  if (!arrayLength) return partial.where(cast);
  return partial.where.apply(partial, cast);
}

function isValidWhere(where) {
  if (isArray(where)) {
    var len = where.length;
    return [len === 2 || len === 3, len];
  }

  if (isObject(where)) return [true];

  return [false];
}

function runQuery(instance, query, needResponse) {
  if (isFunction(instance.verbose)) {
    instance.verbose(query.toString());
  }

  if (instance.isNative) {
    if (needResponse) return query;
    return query.then(function (res) {
      if (isNumber(res)) return res;
      return res ? res.length : 0;
    });
  }

  return instance.pool.acquire().then(function (db) {
    var response = void 0;

    if (needResponse) {
      response = parseResponse(db.exec(query.toString()));
      if (query._sequence && query._sequence[0].method === 'hasTable') {
        response = !!response.length;
      }
    } else {
      db.run(query.toString());

      if (isOneOf(['insert', 'update', 'delete'], query._method)) {
        response = db.getRowsModified();
      }
    }

    writeDatabase(instance, db);
    instance.pool.release(db);
    return response;
  });
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var Model = function () {
  function Model(ctx, name, schema, options) {
    classCallCheck(this, Model);

    Object.assign(this, {
      ctx, name, schema, options
    });
  }

  Model.prototype.create = function create(object, options) {
    var insertion = toDefinition(this, object);

    var query = this.ctx.knex.raw(this.ctx.knex(this.name).insert(insertion).toString().replace(/^insert/i, 'INSERT OR IGNORE'));

    return runQuery(this.ctx, query);
  };

  Model.prototype.find = function find(column, criteria) {
    var _this = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (column && !isString(column)) {
      options = criteria;
      criteria = column;
      column = '';
    }

    options = findOptions(options);

    var order = options.random ? 'random' : options.order;
    var query = this.ctx.knex(this.name).select();
    query = buildWhere(query, criteria);

    if (order) query = buildOrder(query, order);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.offset(options.skip);

    return runQuery(this.ctx, query, true).then(function (response) {
      if (!isArray(response)) {
        return response ? [response] : [];
      }

      return response.map(function (object) {
        if (!column) {
          return fromDefinition(_this, object);
        } else {
          return fromColumnDefinition(_this, column, object[column]);
        }
      });
    });
  };

  Model.prototype.findOne = function findOne(column, criteria) {
    var _this2 = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (column && !isString(column)) {
      options = criteria;
      criteria = column;
      column = '';
    }

    options = findOptions(options);

    var order = options.random ? 'random' : options.order;
    var query = this.ctx.knex(this.name).first();
    query = buildWhere(query, criteria);

    if (order) query = buildOrder(query, order);
    if (options.skip) query = query.offset(options.skip);

    return runQuery(this.ctx, query, true).then(function (response) {
      var result = isArray(response) ? response[0] : response;

      if (!column) {
        return fromDefinition(_this2, result);
      } else {
        // if a column was provided, skip casting
        // the entire object and just process then
        // return that particular property
        return fromColumnDefinition(_this2, column, result[column]);
      }
    });
  };

  Model.prototype.findOrCreate = function findOrCreate(criteria, creation, options) {
    var _this3 = this;

    return this.findOne(criteria, options).then(function (existing) {
      if (existing) return existing;
      return _this3.create(_extends({}, criteria, creation)).then(function () {
        return _this3.findOne(criteria);
      });
    });
  };

  Model.prototype.update = function update(criteria, data, options) {
    var query = this.ctx.knex(this.name).update(data);
    query = buildWhere(query, criteria);

    return runQuery(this.ctx, query);
  };

  Model.prototype.updateOrCreate = function updateOrCreate(criteria, data) {
    var _this4 = this;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    return this.find(criteria, options).then(function (found) {
      if (!found || !found.length) {
        return _this4.create(_extends({}, criteria, data), options);
      } else {
        return _this4.update(criteria, data, options);
      }
    });
  };

  Model.prototype.get = function get$$1(column, criteria, defaultValue) {
    return this.findOne(criteria).then(function (data) {
      if (!data) return defaultValue;
      if (typeof data[column] === 'undefined') {
        return defaultValue;
      }

      return data[column];
    });
  };

  Model.prototype.set = function set$$1(column, criteria, value) {
    if (!this.schema[column]) {
      throw new Error(`no column by the name '${ column }' is defined in '${ this.name }'`);
    }

    return this.update(criteria, {
      [column]: value
    });
  };

  Model.prototype.incr = function incr(column, criteria, amount) {
    amount = Number(amount) || 1;
    var query = this.ctx.knex(this.name).increment(column, amount);
    query = buildWhere(query, criteria);

    return runQuery(this.ctx, query);
  };

  Model.prototype.decr = function decr(column, criteria, amount, allowNegative) {
    amount = Number(amount) || 1;
    var query = this.ctx.knex(this.name);
    var raw = allowNegative ? `${ column } - ${ amount }` : `MAX(0, ${ column } - ${ amount })`;
    query = query.update({ [column]: this.ctx.knex.raw(raw) });
    query = buildWhere(query, criteria);

    return runQuery(this.ctx, query);
  };

  Model.prototype.remove = function remove(criteria) {
    if (!isValidWhere(criteria)) {
      return Promise.resolve(0);
    }

    if (isObject(criteria) && !Object.keys(criteria).length) {
      return Promise.resolve(0);
    }

    var query = this.ctx.knex(this.name).del();
    query = buildWhere(query, criteria);

    return runQuery(this.ctx, query);
  };

  Model.prototype.clear = function clear() {
    var query = this.ctx.knex(this.name).truncate();
    return runQuery(this.ctx, query);
  };

  Model.prototype.count = function count(column, criteria) {
    var _query;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    if (!isString(column)) {
      options = criteria;
      criteria = column;
      column = '*';
    }

    options = aggregateOptions(options);

    var val = `${ column } as count`;
    var method = options.distinct ? 'countDistinct' : 'count';
    var query = this.ctx.knex(this.name)[method](val);
    query = buildWhere(query, criteria);

    if (options.group) query = (_query = query).groupBy.apply(_query, options.group);

    return runQuery(this.ctx, query, true).then(function (res) {
      if (!isArray(res)) return;
      return res[0].count;
    });
  };

  Model.prototype.min = function min(column, criteria) {
    var _query2;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    options = aggregateOptions(options);

    var val = `${ column } as min`;
    var query = this.ctx.knex(this.name).min(val);
    query = buildWhere(query, criteria);

    if (options.group) query = (_query2 = query).groupBy.apply(_query2, options.group);

    return runQuery(this.ctx, query, true).then(function (res) {
      if (!isArray(res)) return;
      return res[0].min;
    });
  };

  Model.prototype.max = function max(column, criteria, options) {
    var _query3;

    options = aggregateOptions(options);

    var val = `${ column } as max`;
    var query = this.ctx.knex(this.name).max(val);
    query = buildWhere(query, criteria);

    if (options.group) query = (_query3 = query).groupBy.apply(_query3, options.group);

    return runQuery(this.ctx, query, true).then(function (res) {
      if (!isArray(res)) return;
      return res[0].max;
    });
  };

  return Model;
}();

module.exports = exports['default'];

var Trilogy = function () {
  function Trilogy(path$$1) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, Trilogy);

    if (!path$$1) {
      throw new Error('trilogy constructor must be provided a file path');
    }

    var obj = this.options = setup(options);
    obj.connection.filename = path.resolve(obj.dir, path$$1);
    this.isNative = obj.client === 'sqlite3';
    this.verbose = obj.verbose;

    var config = { client: 'sqlite3', useNullAsDefault: true };

    if (this.isNative) {
      this.knex = knex(_extends({}, config, { connection: obj.connection }));
    } else {
      this.knex = knex(config);
      this.pool = connect(this);
    }

    this.definitions = new Map();
  }

  Trilogy.prototype.model = function model(name, schema, options) {
    var _this = this;

    if (this.definitions.has(name)) {
      return this.definitions.get(name);
    }

    var model = new Model(this, name, schema, options);
    this.definitions.set(name, model);

    var check = this.knex.schema.hasTable(name);
    var query = this.knex.schema.createTableIfNotExists(name, toKnexSchema(model, modelOptions(options)));

    // we still check to see if the table exists to prevent
    // errors from creating indices that already exist

    if (this.isNative) {
      return check.then(function (exists) {
        if (exists) return model;
        return query.then(function () {
          return model;
        });
      });
    } else {
      return runQuery(this, check, true).then(function (exists) {
        if (exists) return model;
        return runQuery(_this, query);
      });
    }
  };

  Trilogy.prototype.hasModel = function hasModel(name) {
    if (!this.definitions.has(name)) {
      return false;
    }

    var query = this.knex.schema.hasTable(name);
    return runQuery(this, query, true);
  };

  Trilogy.prototype.dropModel = function dropModel(name) {
    var _this2 = this;

    if (!this.definitions.has(name)) {
      return false;
    }

    var query = this.knex.schema.dropTableIfExists(name);
    return runQuery(this, query, true).then(function () {
      _this2.definitions.delete(name);
    });
  };

  Trilogy.prototype.raw = function raw(query, needResponse) {
    return runQuery(this, query, needResponse);
  };

  Trilogy.prototype.close = function close() {
    if (this.isNative) {
      return this.knex.destroy();
    } else {
      return this.pool.drain();
    }
  };

  Trilogy.prototype.create = function create(table, object, options) {
    var model = checkModel(this, table);
    return model.create(object, options);
  };

  Trilogy.prototype.find = function find(location, criteria, options) {
    var _location$split = location.split('.', 2),
        table = _location$split[0],
        column = _location$split[1];

    var model = checkModel(this, table);
    return model.find(column, criteria, options);
  };

  Trilogy.prototype.findOne = function findOne(location, criteria, options) {
    var _location$split2 = location.split('.', 2),
        table = _location$split2[0],
        column = _location$split2[1];

    var model = checkModel(this, table);
    return model.findOne(column, criteria, options);
  };

  Trilogy.prototype.findOrCreate = function findOrCreate(table, criteria, creation, options) {
    var model = checkModel(this, table);
    return model.findOrCreate(criteria, creation, options);
  };

  Trilogy.prototype.update = function update(table, criteria, data, options) {
    var model = checkModel(this, table);
    return model.update(criteria, data, options);
  };

  Trilogy.prototype.updateOrCreate = function updateOrCreate(table, criteria, data, options) {
    var model = checkModel(this, table);
    return model.updateOrCreate(criteria, data, options);
  };

  Trilogy.prototype.get = function get$$1(location, criteria, defaultValue) {
    var _location$split3 = location.split('.', 2),
        table = _location$split3[0],
        column = _location$split3[1];

    var model = checkModel(this, table);
    return model.get(column, criteria, defaultValue);
  };

  Trilogy.prototype.set = function set$$1(location, criteria, value) {
    var _location$split4 = location.split('.', 2),
        table = _location$split4[0],
        column = _location$split4[1];

    var model = checkModel(this, table);
    return model.set(column, criteria, value);
  };

  Trilogy.prototype.incr = function incr(location, criteria, amount) {
    var _location$split5 = location.split('.', 2),
        table = _location$split5[0],
        column = _location$split5[1];

    var model = checkModel(this, table);
    return model.incr(column, criteria, amount);
  };

  Trilogy.prototype.decr = function decr(location, criteria, amount, allowNegative) {
    var _location$split6 = location.split('.', 2),
        table = _location$split6[0],
        column = _location$split6[1];

    var model = checkModel(this, table);
    return model.decr(column, criteria, amount, allowNegative);
  };

  Trilogy.prototype.remove = function remove(location, criteria) {
    var model = checkModel(this, location);
    return model.remove(criteria);
  };

  Trilogy.prototype.clear = function clear(location) {
    var model = checkModel(this, location);
    return model.clear();
  };

  Trilogy.prototype.count = function count(location, criteria, options) {
    if (arguments.length === 0) {
      var query = this.knex('sqlite_master').whereNot('name', 'sqlite_sequence').where({ type: 'table' }).count('* as count');

      return runQuery(this, query, true).then(function (_ref) {
        var count = _ref[0].count;
        return count;
      });
    }

    var _location$split7 = location.split('.', 2),
        table = _location$split7[0],
        column = _location$split7[1];

    var model = checkModel(this, table);
    return column ? model.count(column, criteria, options) : model.count(criteria, options);
  };

  Trilogy.prototype.min = function min(location, criteria, options) {
    var _location$split8 = location.split('.', 2),
        table = _location$split8[0],
        column = _location$split8[1];

    var model = checkModel(this, table);
    return model.min(column, criteria, options);
  };

  Trilogy.prototype.max = function max(location, criteria, options) {
    var _location$split9 = location.split('.', 2),
        table = _location$split9[0],
        column = _location$split9[1];

    var model = checkModel(this, table);
    return model.max(column, criteria, options);
  };

  createClass(Trilogy, [{
    key: 'models',
    get: function get$$1() {
      return [].concat(this.definitions.keys());
    }
  }]);
  return Trilogy;
}();

function checkModel(instance, name) {
  return invariant(instance.definitions.get(name), `no model defined by the name '${ name }'`);
}

module.exports = exports['default'];

module.exports = Trilogy;
