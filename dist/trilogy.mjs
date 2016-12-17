import _defineProperty from 'babel-runtime/helpers/defineProperty';
import _toConsumableArray from 'babel-runtime/helpers/toConsumableArray';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _Object$defineProperties from 'babel-runtime/core-js/object/define-properties';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import Promise from 'bluebird';
import jetpack from 'fs-jetpack';
import arify from 'arify';
import knex from 'knex';
import SQL from 'sql.js';
import { resolve, isAbsolute } from 'path';
import _Object$keys from 'babel-runtime/core-js/object/keys';
import _typeof from 'babel-runtime/helpers/typeof';

var constants = {
  ERR_UNKNOWN: 'an unknown error occurred. Check the stacktrace or report an ' + 'issue if there is a problem with trilogy itself.',
  ERR_COL_MISSING: 'column name is required. Pass it as an independent argument ' + 'or as dot-notation along with the table argument.',
  ERR_NO_DATABASE: 'could not write - no database initialized.',

  DEFAULT_WHERE: {},
  DEFAULT_COLUMNS: ['*']
};

var map = function map(object, fn) {
  return each(object, fn, true);
};

function each(object, fn, map) {
  if (isObject(object)) {
    if (map) {
      var _ret = function () {
        var res = {};

        _Object$keys(object).forEach(function (key) {
          res[key] = fn.call(object, object[key], key, object);
        });

        return {
          v: res
        };
      }();

      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
    } else {
      _Object$keys(object).forEach(function (key) {
        fn.call(object, object[key], key, object);
      });
    }
  } else if (Array.isArray(object)) {
    var method = map ? 'map' : 'forEach';
    return object[method](fn);
  }
}

function isObject(value) {
  return value === Object(value) && !Array.isArray(value);
}

var objToStr = Object.prototype.toString;

function isFunction(value) {
  var type = isObject(value) ? objToStr.call(value) : '';
  return type === '[object Function]' || type === '[object GeneratorFunction]';
}

function isString(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  if (type == null) return false;

  return type === 'string' || !Array.isArray(value) && type === 'object' && objToStr.call(value) === '[object String]';
}

function isBoolean(value) {
  return value === true || value === false;
}

var coercion = { active: true };

function parseResponse(contents) {
  if (contents.length) {
    var columns = contents[0].columns;
    var values = contents[0].values;
    var results = [];
    for (var i = 0; i < values.length; i++) {
      var line = {};
      for (var j = 0; j < columns.length; j++) {
        line[columns[j]] = coercion.active ? stringToBoolean(values[i][j]) : values[i][j];
      }
      results.push(line);
    }
    return results;
  } else {
    return [];
  }
}

// parse a dot or bracket notated string into table, column, & row
// the row value isn't actually used currently
function parseTablePath(table, column, row) {
  if (table.includes('.')) {
    var _table$split = table.split('.');

    var _table$split2 = _slicedToArray(_table$split, 3);

    var top = _table$split2[0];
    var inner = _table$split2[1];
    var nested = _table$split2[2];

    return parseTablePath(top, inner, nested);
  } else if (table.includes('[')) {
    var opener = table.indexOf('[');
    var closer = table.indexOf(']', opener);

    var _top = table.substr(0, opener);
    var _inner = table.slice(opener + 1, closer);

    var rowIndex = _top.length + _inner.length + 2;

    var extra = void 0,
        _nested = void 0;
    if (rowIndex < table.length) {
      extra = table.slice(rowIndex + 1);
      var rowCloser = extra.indexOf(']');
      _nested = extra.substr(0, rowCloser);
    }

    return parseTablePath(_top, _inner, _nested);
  } else {
    return [table, column, row];
  }
}

function sanitizeOrder(order, partial) {
  if (Array.isArray(order) && order.length === 2) {
    return partial.orderBy.apply(partial, _toConsumableArray(order));
  } else if (isString(order)) {
    return partial.orderBy(order);
  } else {
    return partial;
  }
}

function sanitizeWhere(where, partial) {
  if (Array.isArray(where)) {
    var arr = coercion.active ? where.map(booleanToString) : where;
    return partial.where.apply(partial, _toConsumableArray(arr));
  } else if (isFunction(where)) {
    return partial.where(where.bind(partial));
  } else {
    // it's an object
    return partial.where(map(where, function (v) {
      return coercion.active ? booleanToString(v) : v;
    }));
  }
}

function getConflictString(conflict) {
  switch (conflict.toLowerCase()) {
    case 'fail':
      return ' or fail ';
    case 'abort':
      return ' or abort ';
    case 'ignore':
      return ' or ignore ';
    case 'replace':
      return ' or replace ';
    case 'rollback':
      return ' or rollback ';
    default:
      return ' ';
  }
}

function sanitizeColumns(columns) {
  if (Array.isArray(columns)) return columns;
  if (isString(columns)) return [columns];
  return ['*'];
}

function isValidWhere(where) {
  if (isObject(where)) return true;

  if (Array.isArray(where)) {
    var len = where.length;
    return len === 2 || len === 3;
  }

  return false;
}

function processColumn(table, column) {
  if (!column.name) {
    throw new Error('column name required');
  }

  var name = column.name;
  var _column$type = column.type;
  var type = _column$type === undefined ? 'text' : _column$type;


  if (column.unique === 'inline') {
    // bypass knex's usual unique method
    column['__TYPE__'] = type + ' unique';
    type = 'specificType';
    delete column.unique;
  }

  var partial = table[type](name, column['__TYPE__']);

  mapColumnProperties(partial, column);
}

function processArraySchema(table, columns) {
  each(columns, function (column) {
    if (isString(column)) {
      table.text(column);
      return;
    }

    if (isObject(column)) {
      processColumn(table, column);
    }
  });
}

function processObjectSchema(table, columns) {
  each(columns, function (value, name) {
    if (isString(value) && isFunction(table[value])) {
      table[value](name);
    } else if (isObject(value)) {
      var column = _Object$assign({}, { name: name }, value);
      processColumn(table, column);
    }
  });
}

function mapColumnProperties(partial, column) {
  return _Object$keys(column).reduce(function (acc, key) {
    // name & type are handled already
    if (key === 'name' || key === 'type') return acc;

    var value = column[key];
    var method = acc[key];

    if (typeof method !== 'function') {
      return;
    }

    return value === undefined ? method.call(acc) : method.call(acc, value);
  }, partial);
}

function stringToBoolean(value) {
  if (value !== 'true' && value !== 'false') return value;
  return value === 'true';
}

function booleanToString(value) {
  return isBoolean ? '' + value : value;
}

var Trilogy = function () {
  function Trilogy(path$$) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Trilogy);

    if (!path$$) {
      throw new Error('Trilogy constructor must be provided a file path.');
    }

    if (!path.isAbsolute(path$$)) {
      var _opts$dir = opts.dir;
      var dir = _opts$dir === undefined ? process.cwd() : _opts$dir;

      path$$ = path.resolve(dir, path$$);
    }

    _Object$assign(this, {
      path: path$$,
      db: null,
      verbose: isFunction(opts.verbose) ? opts.verbose : function () {},
      errorListener: isFunction(opts.errorListener) ? opts.errorListener : null
    });

    this.coercion = opts.coercion != null ? !!opts.coercion : coercion.active;

    this._init();
  }

  /**
   * Initialize the instance and create or access the database file
   * @private
   */


  _createClass(Trilogy, [{
    key: '_init',
    value: function _init() {
      if (jetpack.exists(this.path) === 'file') {
        var file = jetpack.read(this.path, 'buffer');
        this.db = new SQL.Database(file);
      } else {
        this.db = new SQL.Database();
        this._write();
      }

      var kn = knex({ client: 'sqlite3', useNullAsDefault: true });

      _Object$defineProperties(this, {
        knex: {
          get: function get() {
            return kn;
          }
        },
        sb: {
          get: function get() {
            return kn.schema;
          }
        }
      });
    }

    /**
     * Export the data in memory to the database file
     * @private
     */

  }, {
    key: '_write',
    value: function _write() {
      if (!this.db) {
        this._errorHandler(constants.ERR_NO_DATABASE);
      }

      try {
        var data = this.db.export();
        var buffer = new Buffer(data);

        jetpack.file(this.path, {
          content: buffer, mode: '777'
        });
      } catch (e) {
        this._errorHandler(e);
      }
    }

    /**
     * Execute a query on the database, ignoring its results.
     * @private
     */

  }, {
    key: 'run',
    value: function run(query) {
      return new Promise(function ($return, $error) {
        if (!this.db) {
          return $return(this._errorHandler(constants.ERR_NO_DATABASE));
        }

        if (!isString(query)) {
          query = query.toString();
        }

        this.verbose(query);

        try {
          this.db.run(query);
          this._write();
        } catch (e) {
          return $error(e);
        }
        return $return();
      }.bind(this));
    }

    /**
     * Execute a query on the database and return its results.
     * @private
     */

  }, {
    key: 'exec',
    value: function exec(query) {
      return new Promise(function ($return, $error) {
        if (!this.db) {
          return $return(this._errorHandler(constants.ERR_NO_DATABASE));
        }

        if (!isString(query)) {
          query = query.toString();
        }

        this.verbose(query);

        try {
          return $return(this.db.exec(query));
        } catch (e) {
          return $error(e);
        }
        return $return();
      }.bind(this));
    }
  }, {
    key: 'createTable',
    value: function createTable(name, columns) {
      var $args = arguments;return new Promise(function ($return, $error) {
        var options = $args.length <= 2 || $args[2] === undefined ? {} : $args[2];

        var query = void 0;
        if (isFunction(columns)) {
          query = this.sb.createTableIfNotExists(name, columns);
        } else {
          query = this.sb.createTableIfNotExists(name, function (table) {
            if (Array.isArray(columns)) {
              return processArraySchema(table, columns);
            } else if (isObject(columns)) {
              return processObjectSchema(table, columns);
            }

            if (options.compositeKey) {
              table.primary(options.compositeKey);
            }
          });
        }

        try {
          return $return(this.run(query));
        } catch (e) {
          return $return(this._errorHandler(e));
        }
        return $return();
      }.bind(this));
    }
  }, {
    key: 'hasTable',
    value: function hasTable(name) {
      return new Promise(function ($return, $error) {
        var res;

        function $Try_5_Post() {
          return $return();
        }

        var $Try_5_Catch = function (e) {
          try {
            return $return(this._errorHandler(e));
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this);
        try {
          return this.count('sqlite_master', 'name', { name: name }).then(function ($await_17) {
            try {
              res = $await_17;
              return $return(res > 0);
            } catch ($boundEx) {
              return $Try_5_Catch($boundEx);
            }
          }.bind(this), $Try_5_Catch);
        } catch (e) {
          $Try_5_Catch(e)
        }
      }.bind(this));
    }
  }, {
    key: 'dropTable',
    value: function dropTable(name) {
      return new Promise(function ($return, $error) {
        var $Try_6_Catch = function (e) {
          try {
            return $return(this._errorHandler(e));
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this);
        try {
          return this.run(this.sb.dropTable(name)).then(function ($await_18) {
            try {
              return $return();
            } catch ($boundEx) {
              return $Try_6_Catch($boundEx);
            }
          }.bind(this), $Try_6_Catch);
        } catch (e) {
          $Try_6_Catch(e)
        }
      }.bind(this));
    }
  }, {
    key: 'insert',
    value: function insert(name, values) {
      var $args = arguments;return new Promise(function ($return, $error) {
        var _this, options, obj, query, str;

        _this = this;
        options = $args.length <= 2 || $args[2] === undefined ? {} : $args[2];

        if (!name || !isString(name)) {
          return $return(this._errorHandler('#insert', '\'tableName\' must be a string'));
        }

        obj = map(values, function (v) {
          if (isBoolean(v)) {
            // without some kind of boolean coercion, the query will fail
            // native sqlite leans toward 0s and 1s for booleans
            // with coercion active we convert booleans to strings
            return _this.coercion ? '' + v : v | 0;
          } else {
            return v;
          }
        });

        query = this.knex.table(name).insert(obj);

        // Knex doesn't have support for conflict clauses yet :(
        if (options.conflict) {
          str = getConflictString(options.conflict);
          query = query.toString().replace('insert into', 'insert' + str + 'into');
        }

        function $Try_7_Post() {
          return $return();
        }

        var $Try_7_Catch = function (e) {
          try {
            return $return(this._errorHandler(e));
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this);try {
          return this.run(query).then(function ($await_19) {
            try {
              return $return(this.db.getRowsModified());
            } catch ($boundEx) {
              return $Try_7_Catch($boundEx);
            }
          }.bind(this), $Try_7_Catch);
        } catch (e) {
          $Try_7_Catch(e)
        }
      }.bind(this));
    }
  }, {
    key: 'select',
    value: function select() {
      var $args = arguments;return new Promise(function ($return, $error) {
        var _this2 = this;

        return $return(arify(function (v) {
          v.str('table').obj('options', { random: false }).add('columns', {
            test: function test(value) {
              return isString(value) || Array.isArray(value);
            },
            description: 'a string or an Array of strings',
            defaultValue: constants.DEFAULT_COLUMNS
          }).add('where', {
            test: function test(value) {
              return isValidWhere(value);
            },
            description: 'an Object or an Array of length 2 or 3',
            defaultValue: constants.DEFAULT_WHERE
          }).form('table', '?columns', '?where', '?options');
        }, function (args) {
          return new Promise(function ($return, $error) {
            var columns, partial, query, result;

            columns = sanitizeColumns(args.columns);

            partial = _this2.knex.column(columns).table(args.table);
            query = sanitizeWhere(args.where, partial);

            if (args.options.random) {
              query = query.orderByRaw('RANDOM()');
            } else if (args.options.order) {
              query = sanitizeOrder(args.options.order, partial);
            }

            function $Try_8_Post() {
              return $return();
            }

            var $Try_8_Catch = function (e) {
              try {
                if (e.message.endsWith('of undefined')) {
                  // the value probably just doesn't exist
                  // resolve to undefined rather than reject
                  return $return();
                }
                return $return(_this2._errorHandler(e));
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this);try {
              return _this2.exec(query).then(function ($await_20) {
                try {
                  result = $await_20;
                  return $return(parseResponse(result));
                } catch ($boundEx) {
                  return $Try_8_Catch($boundEx);
                }
              }.bind(this), $Try_8_Catch);
            } catch (e) {
              $Try_8_Catch(e)
            }
          }.bind(this));
        }).apply(undefined, $args));
      }.bind(this));
    }
  }, {
    key: 'first',
    value: function first() {
      var $args = arguments;return new Promise(function ($return, $error) {
        var _this3 = this;

        var inner = function inner(args) {
          return new Promise(function ($return, $error) {
            var columns, partial, query, result;

            columns = sanitizeColumns(args.columns);

            partial = _this3.knex.table(args.table).first(columns);
            query = sanitizeWhere(args.where, partial);

            if (args.options.random) {
              query = query.orderByRaw('RANDOM()');
            }

            function $Try_9_Post() {
              return $return();
            }

            var $Try_9_Catch = function (e) {
              try {
                if (e.message.endsWith('of undefined')) {
                  // the value probably just doesn't exist
                  // resolve to undefined rather than reject
                  return $return();
                }

                return $return(_this3._errorHandler(e));
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this);try {
              return _this3.exec(query).then(function ($await_21) {
                try {
                  result = $await_21;
                  return $return(parseResponse(result)[0]);
                } catch ($boundEx) {
                  return $Try_9_Catch($boundEx);
                }
              }.bind(this), $Try_9_Catch);
            } catch (e) {
              $Try_9_Catch(e)
            }
          }.bind(this));
        };

        return $return(arify(function (v) {
          v.str('table').obj('options', { random: false }).add('columns', {
            test: function test(value) {
              return Array.isArray(value) || isString(value);
            },
            description: 'a string or an Array of strings',
            defaultValue: constants.DEFAULT_COLUMNS
          }).add('where', {
            test: function test(value) {
              return isValidWhere(value);
            },
            description: 'an Object or an Array of length 2 or 3',
            defaultValue: constants.DEFAULT_WHERE
          }).form('table', '?columns', '?where', '?options');
        }, inner).apply(undefined, $args));
      }.bind(this));
    }
  }, {
    key: 'getValue',
    value: function getValue() {
      var $args = arguments;return new Promise(function ($return, $error) {
        var _this4 = this;

        var inner = function inner(args) {
          return new Promise(function ($return, $error) {
            var _helpers$parseTablePa, _helpers$parseTablePa2, tbl, col, partial, query, result;

            _helpers$parseTablePa = parseTablePath(args.table, args.column);
            _helpers$parseTablePa2 = _slicedToArray(_helpers$parseTablePa, 2);
            tbl = _helpers$parseTablePa2[0];
            col = _helpers$parseTablePa2[1];


            if (!col) {
              return $return(_this4._errorHandler(constants.ERR_COL_MISSING));
            }

            partial = _this4.knex.table(tbl).first(col);
            query = sanitizeWhere(args.where, partial);

            function $Try_10_Post() {
              return $return();
            }

            var $Try_10_Catch = function (e) {
              try {
                if (e.message.endsWith('of undefined')) {
                  // the value probably just doesn't exist
                  // resolve to undefined rather than reject
                  return $return();
                }
                return $return(_this4._errorHandler(e));
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this);try {
              return _this4.exec(query).then(function ($await_22) {
                try {
                  result = $await_22;
                  return $return(parseResponse(result)[0][col]);
                } catch ($boundEx) {
                  return $Try_10_Catch($boundEx);
                }
              }.bind(this), $Try_10_Catch);
            } catch (e) {
              $Try_10_Catch(e)
            }
          }.bind(this));
        };

        return $return(arify(function (v) {
          v.str('table').str('column').add('where', {
            test: function test(value) {
              return isValidWhere(value);
            },
            description: 'an Object or an Array of length 2 or 3',
            defaultValue: constants.DEFAULT_WHERE
          }).form('table', '?column', 'where');
        }, inner).apply(undefined, $args));
      }.bind(this));
    }
  }, {
    key: 'update',
    value: function update() {
      var $args = arguments;return new Promise(function ($return, $error) {
        var _this5 = this;

        var inner = function inner(args) {
          return new Promise(function ($return, $error) {
            var partial, col, update, query, str;

            partial = _this5.knex.table(args.table);

            col = map(args.values, function (v) {
              // without some kind of boolean coercion, the query will fail
              // native sqlite leans toward 0s and 1s for booleans
              // with coercion active we convert booleans to strings
              if (isBoolean(v)) {
                return _this5.coercion ? '' + v : v | 0;
              } else {
                return v;
              }
            });

            update = isObject(col) ? partial.update(col) : partial.update.apply(partial, _toConsumableArray(col));

            query = sanitizeWhere(args.where, update);

            // Knex doesn't have support for conflict clauses yet :(
            if (args.options.conflict) {
              str = getConflictString(args.options.conflict);
              query = query.toString().replace('update', 'update' + str);
            }

            function $Try_11_Post() {
              return $return();
            }

            var $Try_11_Catch = function (e) {
              try {
                return $return(_this5._errorHandler(e));
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this);try {
              return _this5.run(query).then(function ($await_23) {
                try {
                  return $return(_this5.db.getRowsModified());
                } catch ($boundEx) {
                  return $Try_11_Catch($boundEx);
                }
              }.bind(this), $Try_11_Catch);
            } catch (e) {
              $Try_11_Catch(e)
            }
          }.bind(this));
        };

        return $return(arify(function (v) {
          v.str('table').obj('options', {}).add('values', {
            test: function test(value) {
              return isObject(value) || Array.isArray(value) && value.length === 2;
            },
            description: 'either an Object or an Array with a length of 2'
          }).add('where', {
            test: function test(value) {
              return isValidWhere(value);
            },
            description: 'an Object or an Array of length 2 or 3',
            defaultValue: constants.DEFAULT_WHERE
          }).form('table', 'values', '?where', '?options');
        }, inner).apply(undefined, $args));
      }.bind(this));
    }
  }, {
    key: 'increment',
    value: function increment() {
      var $args = arguments;return new Promise(function ($return, $error) {
        var _this6 = this;

        var inner = function inner(args) {
          return new Promise(function ($return, $error) {
            var _helpers$parseTablePa3, _helpers$parseTablePa4, tbl, col, partial, query;

            _helpers$parseTablePa3 = parseTablePath(args.table, args.column);
            _helpers$parseTablePa4 = _slicedToArray(_helpers$parseTablePa3, 2);
            tbl = _helpers$parseTablePa4[0];
            col = _helpers$parseTablePa4[1];


            if (!col) {
              return $return(_this6._errorHandler(constants.ERR_COL_MISSING));
            }

            partial = _this6.knex.table(tbl).increment(col, args.amount);
            query = sanitizeWhere(args.where, partial);

            var $Try_12_Catch = function (e) {
              try {
                return $return(_this6._errorHandler(e));
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this);try {
              return _this6.run(query).then(function ($await_24) {
                try {
                  return $return();
                } catch ($boundEx) {
                  return $Try_12_Catch($boundEx);
                }
              }.bind(this), $Try_12_Catch);
            } catch (e) {
              $Try_12_Catch(e)
            }
          }.bind(this));
        };

        return $return(arify(function (v) {
          v.str('table').str('column').num('amount', 1).add('where', {
            test: function test(value) {
              return isValidWhere(value);
            },
            description: 'an Object or an Array of length 2 or 3',
            defaultValue: constants.DEFAULT_WHERE
          }).form('table', '?column', '?amount', '?where');
        }, inner).apply(undefined, $args));
      }.bind(this));
    }
  }, {
    key: 'decrement',
    value: function decrement() {
      var $args = arguments;return new Promise(function ($return, $error) {
        var _this7 = this;

        var inner = function inner(args) {
          return new Promise(function ($return, $error) {
            var _helpers$parseTablePa5 = parseTablePath(args.table, args.column);

            var _helpers$parseTablePa6 = _slicedToArray(_helpers$parseTablePa5, 2);

            var tbl = _helpers$parseTablePa6[0];
            var col = _helpers$parseTablePa6[1];


            if (!col) {
              return $return(_this7._errorHandler(constants.ERR_COL_MISSING));
            }

            var partial = _this7.knex.table(tbl);
            var rawStr = args.allowNegative ? col + ' - ' + args.amount : 'MAX(0, ' + col + ' - ' + args.amount + ')';
            var updated = partial.update(_defineProperty({}, col, _this7.knex.raw(rawStr)));
            var query = sanitizeWhere(args.where, updated);

            try {
              return $return(_this7.run(query));
            } catch (e) {
              return $return(_this7._errorHandler(e));
            }
            return $return();
          }.bind(this));
        };

        return $return(arify(function (v) {
          v.str('table').str('column').num('amount', 1).bln('allowNegative', false).add('where', {
            test: function test(value) {
              return isValidWhere(value);
            },
            description: 'an Object or an Array of length 2 or 3',
            defaultValue: constants.DEFAULT_WHERE
          }).form('table', '?column', '?amount', '?where', '?allowNegative');
        }, inner).apply(undefined, $args));
      }.bind(this));
    }
  }, {
    key: 'del',
    value: function del() {
      var $args = arguments;return new Promise(function ($return, $error) {
        var _this8 = this;

        var inner = function inner(args) {
          return new Promise(function ($return, $error) {
            var partial, query;

            partial = _this8.knex.table(args.table).del();
            query = sanitizeWhere(args.where, partial);

            function $Try_14_Post() {
              return $return();
            }

            var $Try_14_Catch = function (e) {
              try {
                return $return(_this8._errorHandler(e));
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this);try {
              return _this8.run(query).then(function ($await_25) {
                try {
                  return $return(_this8.db.getRowsModified());
                } catch ($boundEx) {
                  return $Try_14_Catch($boundEx);
                }
              }.bind(this), $Try_14_Catch);
            } catch (e) {
              $Try_14_Catch(e)
            }
          }.bind(this));
        };

        return $return(arify(function (v) {
          v.str('table').add('where', {
            test: function test(value) {
              return isValidWhere(value);
            },
            description: 'an Object or an Array of length 2 or 3',
            defaultValue: constants.DEFAULT_WHERE
          }).form('table', '?where');
        }, inner).apply(undefined, $args));
      }.bind(this));
    }
  }, {
    key: 'count',
    value: function count() {
      var $args = arguments;return new Promise(function ($return, $error) {
        var _this9 = this;

        var inner = function inner(args) {
          var partial = void 0;
          if (args.options.distinct) {
            partial = _this9.knex.table(args.table).countDistinct(args.column + ' as count');
          } else {
            partial = _this9.knex.table(args.table).count(args.column + ' as count');
          }

          var query = sanitizeWhere(args.where, partial).toString();

          try {
            var statement = _this9.db.prepare(query);
            var res = statement.getAsObject({});

            if (isObject(res) && res.count) {
              return res.count;
            } else {
              return 0;
            }
          } catch (e) {
            return _this9._errorHandler(e);
          }
        };

        return $return(arify(function (v) {
          v.str('table', 'sqlite_master').str('column', '*').obj('options', { distinct: false }).add('where', {
            test: function test(value) {
              return isValidWhere(value);
            },
            description: 'an Object or an Array of length 2 or 3',
            defaultValue: constants.DEFAULT_WHERE
          }).form('?table', '?column', '?where', '?options');
        }, inner).apply(undefined, $args));
      }.bind(this));
    }
  }, {
    key: 'raw',
    value: function raw(query) {
      var $args = arguments;return new Promise(function ($return, $error) {
        var ret = $args.length <= 1 || $args[1] === undefined ? false : $args[1];

        try {
          var done = ret ? this.exec(query) : this.run(query);
          return $return(ret ? done : undefined);
        } catch (e) {
          return $return(this._errorHandler(e));
        }
        return $return();
      }.bind(this));
    }
  }, {
    key: '_errorHandler',


    /**
     * Normalize errors to `Error` objects. If `err` is a string,
     * it is used as the method path, with `msg` as the message.
     * If an `errorListener` function was provided in the constructor,
     * it will be called with the resulting error.
     *
     * @param {(string|Error)} err
     * @param {string} [msg]
     * @returns {Promise<Error>} a rejected promise with the `Error` object
     * @private
     */
    value: function _errorHandler(err) {
      var msg = arguments.length <= 1 || arguments[1] === undefined ? constants.ERR_UNKNOWN : arguments[1];

      var e = new Error();

      if (err instanceof Error) {
        e = err;
      } else if (isString(err)) {
        e.message = arguments.length === 1 ? '' + err : err + ' :: ' + msg;
      }

      e.name = 'TrilogyError';

      if (this.errorListener) {
        this.errorListener(e);
      }

      return Promise.reject(e);
    }
  }, {
    key: 'schemaBuilder',
    get: function get() {
      return this.sb;
    }
  }, {
    key: 'queryBuilder',
    get: function get() {
      return this.knex;
    }
  }], [{
    key: 'coercion',
    get: function get() {
      return coercion.active;
    },
    set: function set(value) {
      coercion.active = !!value;
      return !!value;
    }
  }]);

  return Trilogy;
}();

module.exports = Trilogy;