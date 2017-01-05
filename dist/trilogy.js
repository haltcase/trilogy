'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var knex = _interopDefault(require('knex'));
var path = require('path');
var osom = _interopDefault(require('osom'));
var type = _interopDefault(require('component-type'));
var jetpack = _interopDefault(require('fs-jetpack'));
var SQL = _interopDefault(require('sql.js'));

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
    type: Any,
    validate(value) {
      return isFunction(value);
    }
  }
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
      return isOneOf(['increments', 'json', String, Number, Boolean, Date], value);
    }
  },
  defaultTo: Any,
  unique: Boolean,
  primary: Boolean,
  nullable: Boolean,
  notNullable: Boolean
});

var constants = {
  ERR_NO_DATABASE: 'could not write - no database initialized.',
  COLUMN_TYPES: ['increments', 'json', 'string', 'number', 'boolean', 'date'],
  KNEX_NO_ARGS: ['primary', 'unique', 'nullable', 'notNullable']
};

function toKnexSchema(model) {
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

        if (isOneOf(constants.KNEX_NO_ARGS, property)) {
          columnProperties[property] && partial[property]();
        } else {
          partial[property](value);
        }
      });
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

  if (!isOneOf(constants.COLUMN_TYPES, type$$1)) {
    type$$1 = 'string';
  }

  return type$$1;
}

function toKnexMethod(type$$1) {
  switch (type$$1) {
    case 'string':
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
  var atPath = instance.options.connection.filename;
  if (jetpack.exists(atPath) === 'file') {
    var file = jetpack.read(atPath, 'buffer');
    instance.db = new SQL.Database(file);
  } else {
    instance.db = new SQL.Database();
    writeDatabase(instance);
  }
}

function writeDatabase(instance) {
  if (!instance.db) {
    throw new Error(constants.ERR_NO_DATABASE);
  }

  try {
    var data = instance.db.export();
    var buffer = new Buffer(data);

    var atPath = instance.options.connection.filename;

    jetpack.file(atPath, {
      content: buffer, mode: '777'
    });
  } catch (e) {
    throw new Error(e.message);
  }
}

var _slicedToArray$2 = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray$1(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
      return partial.orderBy.apply(partial, _toConsumableArray$1(order));
    }
  }

  return partial;
}

function buildWhere(partial, where) {
  var _isValidWhere = isValidWhere(where),
      _isValidWhere2 = _slicedToArray$2(_isValidWhere, 2),
      isValid = _isValidWhere2[0],
      arrayLength = _isValidWhere2[1];

  if (!isValid) return partial;

  var cast = where;
  if (!arrayLength) {
    cast = map(where, castValue);
  } else {
    var i = arrayLength - 1;
    cast[i] = castValue(where[i]);
  }

  if (!arrayLength) return partial.where(cast);
  return partial.where.apply(partial, _toConsumableArray$1(cast));
}

function isValidWhere(where) {
  if (isObject(where)) return [true];

  if (isArray(where)) {
    var len = where.length;
    return [len === 2 || len === 3, len];
  }

  return [false];
}



function runQuery(instance, query, needResponse) {
  if (isFunction(instance.verbose)) {
    instance.verbose(query.toString());
  }

  if (instance.isNative) return query;

  var response = void 0;

  if (needResponse) {
    response = parseResponse(instance.db.exec(query.toString()));
    if (query._sequence && query._sequence[0].method === 'hasTable') {
      return !!response.length;
    }
  } else {
    instance.db.run(query.toString());

    if (isOneOf(['insert', 'update', 'delete'], query._method)) {
      response = instance.db.getRowsModified();
    }
  }

  writeDatabase(instance);
  return Promise.resolve(response);
}

var _extends$1 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray$1 = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass$1 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Model = function () {
  function Model(ctx, name, schema, options) {
    _classCallCheck$1(this, Model);

    Object.assign(this, {
      ctx, name, schema, options
    });
  }

  _createClass$1(Model, [{
    key: 'create',
    value: function create(object, options) {
      var _this = this;

      var insertion = toDefinition(this, object);

      var query = this.ctx.knex.raw(this.ctx.knex(this.name).insert(insertion).toString().replace(/^insert/i, 'INSERT OR IGNORE'));

      return runQuery(this.ctx, query).then(function () {
        return _this.findOne(object);
      });
    }
  }, {
    key: 'find',
    value: function find(column, criteria) {
      var _this2 = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (!isString(column)) {
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
            return fromDefinition(_this2, object);
          } else {
            return fromColumnDefinition(_this2, column, object[column]);
          }
        });
      });
    }
  }, {
    key: 'findOne',
    value: function findOne(column, criteria) {
      var _this3 = this;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      if (!isString(column)) {
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
        if (!isArray(response)) return;

        var _response = _slicedToArray$1(response, 1),
            result = _response[0];

        if (!column) {
          return fromDefinition(_this3, result);
        } else {
          // if a column was provided, skip casting
          // the entire object and just process then
          // return that particular property
          return fromColumnDefinition(_this3, column, result[column]);
        }
      });
    }
  }, {
    key: 'findOrCreate',
    value: function findOrCreate(criteria, creation, options) {
      var _this4 = this;

      return this.findOne(criteria, options).then(function (existing) {
        if (existing) return existing;
        return _this4.create(_extends$1({}, criteria, creation));
      });
    }
  }, {
    key: 'update',
    value: function update(criteria, data, options) {
      var query = this.ctx.knex(this.name).update(data);
      query = buildWhere(query, criteria);

      return runQuery(this.ctx, query);
    }
  }, {
    key: 'updateOrCreate',
    value: function updateOrCreate(criteria, data, options) {
      var _this5 = this;

      return this.find(criteria, options).then(function (found) {
        if (!found || !found.length) {
          return _this5.create(_extends$1({}, criteria, data), options);
        } else {
          return _this5.update(criteria, data, options);
        }
      });
    }
  }, {
    key: 'get',
    value: function get(column, criteria, defaultValue) {
      return this.findOne(criteria).then(function (data) {
        if (!data) return defaultValue;
        if (typeof data[column] === 'undefined') {
          return defaultValue;
        }

        return data[column];
      });
    }
  }, {
    key: 'set',
    value: function set(column, criteria, value) {
      if (!this.schema[column]) {
        throw new Error('no such column in schema');
      }

      return this.update(criteria, {
        [column]: value
      });
    }
  }, {
    key: 'incr',
    value: function incr(column, criteria, amount) {
      amount = Number(amount) || 1;
      var query = this.ctx.knex(this.name).increment(column, amount);
      query = buildWhere(query, criteria);

      return runQuery(this.ctx, query);
    }
  }, {
    key: 'decr',
    value: function decr(column, criteria, amount, allowNegative) {
      amount = Number(amount) || 1;
      var query = this.ctx.knex(this.name);
      var raw = allowNegative ? `${ column } - ${ amount }` : `MAX(0, ${ column } - ${ amount })`;
      query = query.update({ [column]: this.ctx.knex.raw(raw) });
      query = buildWhere(query, criteria);

      return runQuery(this.ctx, query);
    }
  }, {
    key: 'remove',
    value: function remove(criteria) {
      var query = this.ctx.knex(this.name).del();
      query = buildWhere(query, criteria);

      return runQuery(this.ctx, query);
    }
  }, {
    key: 'count',
    value: function count(column, criteria) {
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

      if (options.groupBy) query = (_query = query).groupBy.apply(_query, _toConsumableArray(options.groupBy));

      return runQuery(this.ctx, query, true).then(function (res) {
        if (!isArray(res)) return;
        return res[0].count;
      });
    }
  }, {
    key: 'min',
    value: function min(column, criteria) {
      var _query2;

      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      options = aggregateOptions(options);

      var val = `${ column } as min`;
      var query = this.ctx.knex(this.name).min(val);
      query = buildWhere(query, criteria);

      if (options.groupBy) query = (_query2 = query).groupBy.apply(_query2, _toConsumableArray(options.groupBy));

      return runQuery(this.ctx, query, true).then(function (res) {
        if (!isArray(res)) return;
        return res[0].min;
      });
    }
  }, {
    key: 'max',
    value: function max(column, criteria, options) {
      var _query3;

      options = aggregateOptions(options);

      var val = `${ column } as max`;
      var query = this.ctx.knex(this.name).max(val);
      query = buildWhere(query, criteria);

      if (options.groupBy) query = (_query3 = query).groupBy.apply(_query3, _toConsumableArray(options.groupBy));

      return runQuery(this.ctx, query, true).then(function (res) {
        if (!isArray(res)) return;
        return res[0].max;
      });
    }
  }]);

  return Model;
}();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Trilogy = function () {
  function Trilogy(path$$1) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Trilogy);

    if (!path$$1) {
      throw new Error('trilogy constructor must be provided a file path.');
    }

    this.options = setup(options);
    this.options.connection.filename = path.resolve(this.options.dir, path$$1);
    this.isNative = this.options.client === 'sqlite3';
    this.verbose = options.verbose;

    var config = { client: 'sqlite3', useNullAsDefault: true };

    if (this.isNative) {
      this.knex = knex(_extends({}, config, { connection: this.options.connection }));
    } else {
      this.knex = knex(config);
      readDatabase(this, this.options.connection.filename);
    }

    this.definitions = new Map();
  }

  _createClass(Trilogy, [{
    key: 'model',
    value: function model(name, schema, options) {
      if (this.definitions.has(name)) {
        return this.definitions.get(name);
      }

      var model = new Model(this, name, schema, options);
      this.definitions.set(name, model);

      var check = this.knex.schema.hasTable(name);
      var query = this.knex.schema.createTableIfNotExists(name, toKnexSchema(model));

      if (this.isNative) {
        check.then(function (tableExists) {
          if (tableExists) return;
          query.then(function () {});
        });
      } else {
        var exists = runQuery(this, check, true);
        if (!exists) runQuery(this, query);
      }

      return model;
    }
  }, {
    key: 'create',
    value: function create(table, object, options) {
      var model = checkModel(this, table);
      return model.create(object, options);
    }
  }, {
    key: 'find',
    value: function find(location, criteria, options) {
      var _location$split = location.split('.', 2),
          _location$split2 = _slicedToArray(_location$split, 2),
          table = _location$split2[0],
          column = _location$split2[1];

      var model = checkModel(this, table);
      return model.find(column, criteria, options);
    }
  }, {
    key: 'findOne',
    value: function findOne(location, criteria, options) {
      var _location$split3 = location.split('.', 2),
          _location$split4 = _slicedToArray(_location$split3, 2),
          table = _location$split4[0],
          column = _location$split4[1];

      var model = checkModel(this, table);
      return model.findOne(column, criteria, options);
    }
  }, {
    key: 'findOrCreate',
    value: function findOrCreate(table, criteria, creation, options) {
      var model = checkModel(this, table);
      return model.findOrCreate(criteria, creation, options);
    }
  }, {
    key: 'update',
    value: function update(table, criteria, data, options) {
      var model = checkModel(this, table);
      return model.update(criteria, data, options);
    }
  }, {
    key: 'updateOrCreate',
    value: function updateOrCreate(table, criteria, data, options) {
      var model = checkModel(this, table);
      return model.updateOrCreate(criteria, data, options);
    }
  }, {
    key: 'get',
    value: function get(location, criteria, defaultValue) {
      var _location$split5 = location.split('.', 2),
          _location$split6 = _slicedToArray(_location$split5, 2),
          table = _location$split6[0],
          column = _location$split6[1];

      var model = checkModel(this, table);
      return model.get(column, criteria, defaultValue);
    }
  }, {
    key: 'set',
    value: function set(location, criteria, value) {
      var _location$split7 = location.split('.', 2),
          _location$split8 = _slicedToArray(_location$split7, 2),
          table = _location$split8[0],
          column = _location$split8[1];

      var model = checkModel(this, table);
      return model.set(column, criteria, value);
    }
  }, {
    key: 'incr',
    value: function incr(location, criteria, amount) {
      var _location$split9 = location.split('.', 2),
          _location$split10 = _slicedToArray(_location$split9, 2),
          table = _location$split10[0],
          column = _location$split10[1];

      var model = checkModel(this, table);
      return model.incr(column, criteria, amount);
    }
  }, {
    key: 'decr',
    value: function decr(location, criteria, amount, allowNegative) {
      var _location$split11 = location.split('.', 2),
          _location$split12 = _slicedToArray(_location$split11, 2),
          table = _location$split12[0],
          column = _location$split12[1];

      var model = checkModel(this, table);
      return model.decr(column, criteria, amount, allowNegative);
    }
  }, {
    key: 'remove',
    value: function remove(location, criteria) {
      var model = checkModel(this, location);
      return model.remove(criteria);
    }
  }, {
    key: 'count',
    value: function count(location, criteria, options) {
      var _location$split13 = location.split('.', 2),
          _location$split14 = _slicedToArray(_location$split13, 2),
          table = _location$split14[0],
          column = _location$split14[1];

      var model = checkModel(this, table);
      return model.count(column, criteria, options);
    }
  }, {
    key: 'min',
    value: function min(location, criteria, options) {
      var _location$split15 = location.split('.', 2),
          _location$split16 = _slicedToArray(_location$split15, 2),
          table = _location$split16[0],
          column = _location$split16[1];

      var model = checkModel(this, table);
      return model.min(column, criteria, options);
    }
  }, {
    key: 'max',
    value: function max(location, criteria, options) {
      var _location$split17 = location.split('.', 2),
          _location$split18 = _slicedToArray(_location$split17, 2),
          table = _location$split18[0],
          column = _location$split18[1];

      var model = checkModel(this, table);
      return model.max(column, criteria, options);
    }
  }, {
    key: 'models',
    get: function get() {
      return this.definitions.keys();
    }
  }]);

  return Trilogy;
}();

function checkModel(instance, name) {
  return invariant(instance.definitions.get(name), `no such table '${ name }'`);
}

module.exports = Trilogy;
