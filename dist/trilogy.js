'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _defineProperty = _interopDefault(require('babel-runtime/helpers/defineProperty'));
var _toConsumableArray = _interopDefault(require('babel-runtime/helpers/toConsumableArray'));
var _slicedToArray = _interopDefault(require('babel-runtime/helpers/slicedToArray'));
var _regeneratorRuntime = _interopDefault(require('babel-runtime/regenerator'));
var _asyncToGenerator = _interopDefault(require('babel-runtime/helpers/asyncToGenerator'));
var _Object$defineProperties = _interopDefault(require('babel-runtime/core-js/object/define-properties'));
var _Object$assign = _interopDefault(require('babel-runtime/core-js/object/assign'));
var _classCallCheck = _interopDefault(require('babel-runtime/helpers/classCallCheck'));
var _createClass = _interopDefault(require('babel-runtime/helpers/createClass'));
var Promise = _interopDefault(require('bluebird'));
var jetpack = _interopDefault(require('fs-jetpack'));
var arify = _interopDefault(require('arify'));
var knex = _interopDefault(require('knex'));
var SQL = _interopDefault(require('sql.js'));
var path = require('path');
var _Object$keys = _interopDefault(require('babel-runtime/core-js/object/keys'));
var _typeof = _interopDefault(require('babel-runtime/helpers/typeof'));

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
    var _table$split = table.split('.'),
        _table$split2 = _slicedToArray(_table$split, 3),
        top = _table$split2[0],
        inner = _table$split2[1],
        nested = _table$split2[2];

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

  var name = column.name,
      _column$type = column.type,
      type = _column$type === undefined ? 'text' : _column$type;


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
  function Trilogy(path$$1) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Trilogy);

    if (!path$$1) {
      throw new Error('Trilogy constructor must be provided a file path.');
    }

    if (!path.isAbsolute(path$$1)) {
      var _opts$dir = opts.dir,
          dir = _opts$dir === undefined ? process.cwd() : _opts$dir;

      path$$1 = path.resolve(dir, path$$1);
    }

    _Object$assign(this, {
      path: path$$1,
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
    value: function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(query) {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (this.db) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return', this._errorHandler(constants.ERR_NO_DATABASE));

              case 2:

                if (!isString(query)) {
                  query = query.toString();
                }

                this.verbose(query);

                _context.prev = 4;

                this.db.run(query);
                this._write();
                _context.next = 12;
                break;

              case 9:
                _context.prev = 9;
                _context.t0 = _context['catch'](4);
                throw _context.t0;

              case 12:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this, [[4, 9]]);
      }));

      function run(_x2) {
        return _ref.apply(this, arguments);
      }

      return run;
    }()

    /**
     * Execute a query on the database and return its results.
     * @private
     */

  }, {
    key: 'exec',
    value: function () {
      var _ref2 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee2(query) {
        return _regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (this.db) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt('return', this._errorHandler(constants.ERR_NO_DATABASE));

              case 2:

                if (!isString(query)) {
                  query = query.toString();
                }

                this.verbose(query);

                _context2.prev = 4;
                return _context2.abrupt('return', this.db.exec(query));

              case 8:
                _context2.prev = 8;
                _context2.t0 = _context2['catch'](4);
                throw _context2.t0;

              case 11:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[4, 8]]);
      }));

      function exec(_x3) {
        return _ref2.apply(this, arguments);
      }

      return exec;
    }()
  }, {
    key: 'createTable',
    value: function () {
      var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3(name, columns) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var query;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                query = void 0;

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

                _context3.prev = 2;
                return _context3.abrupt('return', this.run(query));

              case 6:
                _context3.prev = 6;
                _context3.t0 = _context3['catch'](2);
                return _context3.abrupt('return', this._errorHandler(_context3.t0));

              case 9:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[2, 6]]);
      }));

      function createTable(_x4, _x5) {
        return _ref3.apply(this, arguments);
      }

      return createTable;
    }()
  }, {
    key: 'hasTable',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee4(name) {
        var res;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.prev = 0;
                _context4.next = 3;
                return this.count('sqlite_master', 'name', { name: name });

              case 3:
                res = _context4.sent;
                return _context4.abrupt('return', res > 0);

              case 7:
                _context4.prev = 7;
                _context4.t0 = _context4['catch'](0);
                return _context4.abrupt('return', this._errorHandler(_context4.t0));

              case 10:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this, [[0, 7]]);
      }));

      function hasTable(_x7) {
        return _ref4.apply(this, arguments);
      }

      return hasTable;
    }()
  }, {
    key: 'dropTable',
    value: function () {
      var _ref5 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee5(name) {
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.prev = 0;
                _context5.next = 3;
                return this.run(this.sb.dropTable(name));

              case 3:
                _context5.next = 8;
                break;

              case 5:
                _context5.prev = 5;
                _context5.t0 = _context5['catch'](0);
                return _context5.abrupt('return', this._errorHandler(_context5.t0));

              case 8:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this, [[0, 5]]);
      }));

      function dropTable(_x8) {
        return _ref5.apply(this, arguments);
      }

      return dropTable;
    }()
  }, {
    key: 'insert',
    value: function () {
      var _ref6 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee6(name, values) {
        var _this = this;

        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        var obj, query, str;
        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(!name || !isString(name))) {
                  _context6.next = 2;
                  break;
                }

                return _context6.abrupt('return', this._errorHandler('#insert', '\'tableName\' must be a string'));

              case 2:
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

                _context6.prev = 5;
                _context6.next = 8;
                return this.run(query);

              case 8:
                return _context6.abrupt('return', this.db.getRowsModified());

              case 11:
                _context6.prev = 11;
                _context6.t0 = _context6['catch'](5);
                return _context6.abrupt('return', this._errorHandler(_context6.t0));

              case 14:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this, [[5, 11]]);
      }));

      function insert(_x9, _x10) {
        return _ref6.apply(this, arguments);
      }

      return insert;
    }()
  }, {
    key: 'select',
    value: function () {
      var _ref7 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee8() {
        var _this2 = this;

        var _args8 = arguments;
        return _regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                return _context8.abrupt('return', arify(function (v) {
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
                }, function () {
                  var _ref8 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee7(args) {
                    var columns, partial, query, result;
                    return _regeneratorRuntime.wrap(function _callee7$(_context7) {
                      while (1) {
                        switch (_context7.prev = _context7.next) {
                          case 0:
                            columns = sanitizeColumns(args.columns);
                            partial = _this2.knex.column(columns).table(args.table);
                            query = sanitizeWhere(args.where, partial);


                            if (args.options.random) {
                              query = query.orderByRaw('RANDOM()');
                            } else if (args.options.order) {
                              query = sanitizeOrder(args.options.order, partial);
                            }

                            _context7.prev = 4;
                            _context7.next = 7;
                            return _this2.exec(query);

                          case 7:
                            result = _context7.sent;
                            return _context7.abrupt('return', parseResponse(result));

                          case 11:
                            _context7.prev = 11;
                            _context7.t0 = _context7['catch'](4);

                            if (!_context7.t0.message.endsWith('of undefined')) {
                              _context7.next = 15;
                              break;
                            }

                            return _context7.abrupt('return');

                          case 15:
                            return _context7.abrupt('return', _this2._errorHandler(_context7.t0));

                          case 16:
                          case 'end':
                            return _context7.stop();
                        }
                      }
                    }, _callee7, _this2, [[4, 11]]);
                  }));

                  return function (_x12) {
                    return _ref8.apply(this, arguments);
                  };
                }()).apply(undefined, _args8));

              case 1:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function select() {
        return _ref7.apply(this, arguments);
      }

      return select;
    }()
  }, {
    key: 'first',
    value: function () {
      var _ref9 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee10() {
        var _this3 = this;

        var inner,
            _args10 = arguments;
        return _regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                inner = function () {
                  var _ref10 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee9(args) {
                    var columns, partial, query, result;
                    return _regeneratorRuntime.wrap(function _callee9$(_context9) {
                      while (1) {
                        switch (_context9.prev = _context9.next) {
                          case 0:
                            columns = sanitizeColumns(args.columns);
                            partial = _this3.knex.table(args.table).first(columns);
                            query = sanitizeWhere(args.where, partial);


                            if (args.options.random) {
                              query = query.orderByRaw('RANDOM()');
                            }

                            _context9.prev = 4;
                            _context9.next = 7;
                            return _this3.exec(query);

                          case 7:
                            result = _context9.sent;
                            return _context9.abrupt('return', parseResponse(result)[0]);

                          case 11:
                            _context9.prev = 11;
                            _context9.t0 = _context9['catch'](4);

                            if (!_context9.t0.message.endsWith('of undefined')) {
                              _context9.next = 15;
                              break;
                            }

                            return _context9.abrupt('return');

                          case 15:
                            return _context9.abrupt('return', _this3._errorHandler(_context9.t0));

                          case 16:
                          case 'end':
                            return _context9.stop();
                        }
                      }
                    }, _callee9, _this3, [[4, 11]]);
                  }));

                  return function inner(_x13) {
                    return _ref10.apply(this, arguments);
                  };
                }();

                return _context10.abrupt('return', arify(function (v) {
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
                }, inner).apply(undefined, _args10));

              case 2:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function first() {
        return _ref9.apply(this, arguments);
      }

      return first;
    }()
  }, {
    key: 'getValue',
    value: function () {
      var _ref11 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee12() {
        var _this4 = this;

        var inner,
            _args12 = arguments;
        return _regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                inner = function () {
                  var _ref12 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee11(args) {
                    var _helpers$parseTablePa, _helpers$parseTablePa2, tbl, col, partial, query, result;

                    return _regeneratorRuntime.wrap(function _callee11$(_context11) {
                      while (1) {
                        switch (_context11.prev = _context11.next) {
                          case 0:
                            _helpers$parseTablePa = parseTablePath(args.table, args.column), _helpers$parseTablePa2 = _slicedToArray(_helpers$parseTablePa, 2), tbl = _helpers$parseTablePa2[0], col = _helpers$parseTablePa2[1];

                            if (col) {
                              _context11.next = 3;
                              break;
                            }

                            return _context11.abrupt('return', _this4._errorHandler(constants.ERR_COL_MISSING));

                          case 3:
                            partial = _this4.knex.table(tbl).first(col);
                            query = sanitizeWhere(args.where, partial);
                            _context11.prev = 5;
                            _context11.next = 8;
                            return _this4.exec(query);

                          case 8:
                            result = _context11.sent;
                            return _context11.abrupt('return', parseResponse(result)[0][col]);

                          case 12:
                            _context11.prev = 12;
                            _context11.t0 = _context11['catch'](5);

                            if (!_context11.t0.message.endsWith('of undefined')) {
                              _context11.next = 16;
                              break;
                            }

                            return _context11.abrupt('return');

                          case 16:
                            return _context11.abrupt('return', _this4._errorHandler(_context11.t0));

                          case 17:
                          case 'end':
                            return _context11.stop();
                        }
                      }
                    }, _callee11, _this4, [[5, 12]]);
                  }));

                  return function inner(_x14) {
                    return _ref12.apply(this, arguments);
                  };
                }();

                return _context12.abrupt('return', arify(function (v) {
                  v.str('table').str('column').add('where', {
                    test: function test(value) {
                      return isValidWhere(value);
                    },
                    description: 'an Object or an Array of length 2 or 3',
                    defaultValue: constants.DEFAULT_WHERE
                  }).form('table', '?column', 'where');
                }, inner).apply(undefined, _args12));

              case 2:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function getValue() {
        return _ref11.apply(this, arguments);
      }

      return getValue;
    }()
  }, {
    key: 'update',
    value: function () {
      var _ref13 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee14() {
        var _this5 = this;

        var inner,
            _args14 = arguments;
        return _regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                inner = function () {
                  var _ref14 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee13(args) {
                    var partial, col, update, query, str;
                    return _regeneratorRuntime.wrap(function _callee13$(_context13) {
                      while (1) {
                        switch (_context13.prev = _context13.next) {
                          case 0:
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

                            _context13.prev = 5;
                            _context13.next = 8;
                            return _this5.run(query);

                          case 8:
                            return _context13.abrupt('return', _this5.db.getRowsModified());

                          case 11:
                            _context13.prev = 11;
                            _context13.t0 = _context13['catch'](5);
                            return _context13.abrupt('return', _this5._errorHandler(_context13.t0));

                          case 14:
                          case 'end':
                            return _context13.stop();
                        }
                      }
                    }, _callee13, _this5, [[5, 11]]);
                  }));

                  return function inner(_x15) {
                    return _ref14.apply(this, arguments);
                  };
                }();

                return _context14.abrupt('return', arify(function (v) {
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
                }, inner).apply(undefined, _args14));

              case 2:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function update() {
        return _ref13.apply(this, arguments);
      }

      return update;
    }()
  }, {
    key: 'increment',
    value: function () {
      var _ref15 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee16() {
        var _this6 = this;

        var inner,
            _args16 = arguments;
        return _regeneratorRuntime.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                inner = function () {
                  var _ref16 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee15(args) {
                    var _helpers$parseTablePa3, _helpers$parseTablePa4, tbl, col, partial, query;

                    return _regeneratorRuntime.wrap(function _callee15$(_context15) {
                      while (1) {
                        switch (_context15.prev = _context15.next) {
                          case 0:
                            _helpers$parseTablePa3 = parseTablePath(args.table, args.column), _helpers$parseTablePa4 = _slicedToArray(_helpers$parseTablePa3, 2), tbl = _helpers$parseTablePa4[0], col = _helpers$parseTablePa4[1];

                            if (col) {
                              _context15.next = 3;
                              break;
                            }

                            return _context15.abrupt('return', _this6._errorHandler(constants.ERR_COL_MISSING));

                          case 3:
                            partial = _this6.knex.table(tbl).increment(col, args.amount);
                            query = sanitizeWhere(args.where, partial);
                            _context15.prev = 5;
                            _context15.next = 8;
                            return _this6.run(query);

                          case 8:
                            _context15.next = 13;
                            break;

                          case 10:
                            _context15.prev = 10;
                            _context15.t0 = _context15['catch'](5);
                            return _context15.abrupt('return', _this6._errorHandler(_context15.t0));

                          case 13:
                          case 'end':
                            return _context15.stop();
                        }
                      }
                    }, _callee15, _this6, [[5, 10]]);
                  }));

                  return function inner(_x16) {
                    return _ref16.apply(this, arguments);
                  };
                }();

                return _context16.abrupt('return', arify(function (v) {
                  v.str('table').str('column').num('amount', 1).add('where', {
                    test: function test(value) {
                      return isValidWhere(value);
                    },
                    description: 'an Object or an Array of length 2 or 3',
                    defaultValue: constants.DEFAULT_WHERE
                  }).form('table', '?column', '?amount', '?where');
                }, inner).apply(undefined, _args16));

              case 2:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function increment() {
        return _ref15.apply(this, arguments);
      }

      return increment;
    }()
  }, {
    key: 'decrement',
    value: function () {
      var _ref17 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee18() {
        var _this7 = this;

        var inner,
            _args18 = arguments;
        return _regeneratorRuntime.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                inner = function () {
                  var _ref18 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee17(args) {
                    var _helpers$parseTablePa5, _helpers$parseTablePa6, tbl, col, partial, rawStr, updated, query;

                    return _regeneratorRuntime.wrap(function _callee17$(_context17) {
                      while (1) {
                        switch (_context17.prev = _context17.next) {
                          case 0:
                            _helpers$parseTablePa5 = parseTablePath(args.table, args.column), _helpers$parseTablePa6 = _slicedToArray(_helpers$parseTablePa5, 2), tbl = _helpers$parseTablePa6[0], col = _helpers$parseTablePa6[1];

                            if (col) {
                              _context17.next = 3;
                              break;
                            }

                            return _context17.abrupt('return', _this7._errorHandler(constants.ERR_COL_MISSING));

                          case 3:
                            partial = _this7.knex.table(tbl);
                            rawStr = args.allowNegative ? col + ' - ' + args.amount : 'MAX(0, ' + col + ' - ' + args.amount + ')';
                            updated = partial.update(_defineProperty({}, col, _this7.knex.raw(rawStr)));
                            query = sanitizeWhere(args.where, updated);
                            _context17.prev = 7;
                            return _context17.abrupt('return', _this7.run(query));

                          case 11:
                            _context17.prev = 11;
                            _context17.t0 = _context17['catch'](7);
                            return _context17.abrupt('return', _this7._errorHandler(_context17.t0));

                          case 14:
                          case 'end':
                            return _context17.stop();
                        }
                      }
                    }, _callee17, _this7, [[7, 11]]);
                  }));

                  return function inner(_x17) {
                    return _ref18.apply(this, arguments);
                  };
                }();

                return _context18.abrupt('return', arify(function (v) {
                  v.str('table').str('column').num('amount', 1).bln('allowNegative', false).add('where', {
                    test: function test(value) {
                      return isValidWhere(value);
                    },
                    description: 'an Object or an Array of length 2 or 3',
                    defaultValue: constants.DEFAULT_WHERE
                  }).form('table', '?column', '?amount', '?where', '?allowNegative');
                }, inner).apply(undefined, _args18));

              case 2:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function decrement() {
        return _ref17.apply(this, arguments);
      }

      return decrement;
    }()
  }, {
    key: 'del',
    value: function () {
      var _ref19 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee20() {
        var _this8 = this;

        var inner,
            _args20 = arguments;
        return _regeneratorRuntime.wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                inner = function () {
                  var _ref20 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee19(args) {
                    var partial, query;
                    return _regeneratorRuntime.wrap(function _callee19$(_context19) {
                      while (1) {
                        switch (_context19.prev = _context19.next) {
                          case 0:
                            partial = _this8.knex.table(args.table).del();
                            query = sanitizeWhere(args.where, partial);
                            _context19.prev = 2;
                            _context19.next = 5;
                            return _this8.run(query);

                          case 5:
                            return _context19.abrupt('return', _this8.db.getRowsModified());

                          case 8:
                            _context19.prev = 8;
                            _context19.t0 = _context19['catch'](2);
                            return _context19.abrupt('return', _this8._errorHandler(_context19.t0));

                          case 11:
                          case 'end':
                            return _context19.stop();
                        }
                      }
                    }, _callee19, _this8, [[2, 8]]);
                  }));

                  return function inner(_x18) {
                    return _ref20.apply(this, arguments);
                  };
                }();

                return _context20.abrupt('return', arify(function (v) {
                  v.str('table').add('where', {
                    test: function test(value) {
                      return isValidWhere(value);
                    },
                    description: 'an Object or an Array of length 2 or 3',
                    defaultValue: constants.DEFAULT_WHERE
                  }).form('table', '?where');
                }, inner).apply(undefined, _args20));

              case 2:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20, this);
      }));

      function del() {
        return _ref19.apply(this, arguments);
      }

      return del;
    }()
  }, {
    key: 'count',
    value: function () {
      var _ref21 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee21() {
        var _this9 = this;

        var inner,
            _args21 = arguments;
        return _regeneratorRuntime.wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                inner = function inner(args) {
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

                return _context21.abrupt('return', arify(function (v) {
                  v.str('table', 'sqlite_master').str('column', '*').obj('options', { distinct: false }).add('where', {
                    test: function test(value) {
                      return isValidWhere(value);
                    },
                    description: 'an Object or an Array of length 2 or 3',
                    defaultValue: constants.DEFAULT_WHERE
                  }).form('?table', '?column', '?where', '?options');
                }, inner).apply(undefined, _args21));

              case 2:
              case 'end':
                return _context21.stop();
            }
          }
        }, _callee21, this);
      }));

      function count() {
        return _ref21.apply(this, arguments);
      }

      return count;
    }()
  }, {
    key: 'raw',
    value: function () {
      var _ref22 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee22(query) {
        var ret = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        var done;
        return _regeneratorRuntime.wrap(function _callee22$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                _context22.prev = 0;
                done = ret ? this.exec(query) : this.run(query);
                return _context22.abrupt('return', ret ? done : undefined);

              case 5:
                _context22.prev = 5;
                _context22.t0 = _context22['catch'](0);
                return _context22.abrupt('return', this._errorHandler(_context22.t0));

              case 8:
              case 'end':
                return _context22.stop();
            }
          }
        }, _callee22, this, [[0, 5]]);
      }));

      function raw(_x19) {
        return _ref22.apply(this, arguments);
      }

      return raw;
    }()
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
      var msg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : constants.ERR_UNKNOWN;

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
