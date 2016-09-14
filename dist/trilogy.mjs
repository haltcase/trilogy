import _defineProperty from 'babel-runtime/helpers/defineProperty';
import _toConsumableArray from 'babel-runtime/helpers/toConsumableArray';
import _slicedToArray from 'babel-runtime/helpers/slicedToArray';
import _typeof from 'babel-runtime/helpers/typeof';
import _regeneratorRuntime from 'babel-runtime/regenerator';
import _asyncToGenerator from 'babel-runtime/helpers/asyncToGenerator';
import _Object$assign from 'babel-runtime/core-js/object/assign';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import Promise from 'native-or-lie';
import jetpack from 'fs-jetpack';
import arify from 'arify';
import knex from 'knex';
import SQL from 'sql.js';
import each from 'lodash.foreach';
import isPlainObject from 'is-plain-obj';

var constants = {
  ERR_UNKNOWN: "an unknown error occurred. Check the stacktrace or report an\n     issue if there is a problem with trilogy itself.",
  ERR_COL_MISSING: "column name is required. Pass it as an independent argument\n     or as dot-notation along with the table argument.",
  ERR_NO_DATABASE: "Could not write - no database initialized."
};

var objToStr = Object.prototype.toString;

function isObject(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return value && (type === 'object' || type === 'function');
}

function isFunction(value) {
  var type = isObject(value) ? objToStr.call(value) : '';
  return type === '[object Function]' || type === '[object GeneratorFunction]';
}

function isString(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  if (type == null) return false;

  return type === 'string' || !Array.isArray(value) && type === 'object' && objToStr.call(value) === '[object String]';
}

var Trilogy = function () {

  /**
   * Initialize a new datastore instance, creating an SQLite database
   * file at the `fileName` path if it does not yet exist, or reading
   * it if it does.
   *
   * @param {string} fileName
   *  Either a path to an existing database or the path at which one
   *  should be created.
   * @param {Object} [opts={}]
   * @param {Function} [opts.verbose]
   *  A function that will receive every query run against the database
   * @param {Function} [opts.errorListener]
   *  A function that receives any errors thrown during query execution
   * @throws if `fileName` is not provided
   *
   * @example
   *
   * import Trilogy from 'trilogy'
   *
   * const db = new Trilogy('./storage.db')
   *
   * // WITH OPTIONS:
   * // verbose function
   * const db = new Trilogy('./storage.db', {
   *   verbose: console.log.bind(console)
   * })
   *
   * // errorListener function
   * function errorHandler (err) {
   *   if (err.message === `Trilogy#createTable :: 'columns' must be an array`) {
   *     console.log('Crap. Should have read the docs!')
   *   }
   * }
   *
   * const db = new Trilogy('./storage.db', {
   *   errorListener: errorHandler
   * })
   */
  function Trilogy(fileName) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {
      verbose: function verbose() {},
      errorListener: null
    } : arguments[1];

    _classCallCheck(this, Trilogy);

    if (!fileName) throw new Error('Trilogy constructor must be provided a file path.');

    _Object$assign(this, {
      fileName: fileName,
      db: null,
      verbose: isFunction(opts.verbose) ? opts.verbose : function () {},
      errorListener: isFunction(opts.errorListener) ? opts.errorListener : null
    });

    this._init();
  }

  /**
   * Initialize the instance and create or access the database file
   * @private
   */


  _createClass(Trilogy, [{
    key: '_init',
    value: function _init() {
      if (jetpack.exists(this.fileName)) {
        var file = jetpack.read(this.fileName, 'buffer');
        this.db = new SQL.Database(file);
      } else {
        this.db = new SQL.Database();
        this._write();
      }

      var kn = knex({ client: 'sqlite', useNullAsDefault: true });

      this.knex = kn;
      this.sb = kn.schema;
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

        jetpack.file(this.fileName, {
          content: buffer, mode: '777'
        });
      } catch (e) {
        this._errorHandler(e);
      }
    }

    /**
     * Execute a query on the database, ignoring its results.
     *
     * @param {(Object|string)} query
     *  Any SQLite query string. If an Object is provided, a `toString`
     *  conversion will be attempted in the case it's a knex query object.
     * @returns {Promise}
     *
     * @see {@link Trilogy#exec} if you need a return value
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

                if (!isString(query)) query = query.toString();
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
     *
     * @param {(Object|string)} query
     *  Any SQLite query string. If an Object is provided, a `toString`
     *  conversion will be attempted in the case it's a knex query object.
     * @returns {Promise<Array>} an `Array` containing query result objects
     *
     * @see {@link Trilogy#run} if you don't care about a return value
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

                if (!isString(query)) query = query.toString();
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

    /**
     * Add a table to the database. The `columns` argument must be an array of
     * either strings or Objects, which can be mixed and matched. String values
     * default to a column of the SQLite 'text' type. If another type is needed
     * or any other attributes, use an Object.
     *
     * All the properties of the supplied column Object are passed to knex. Some
     * attributes require no values, such as `primary` or `nullable`. In these
     * cases, their presence in the object is enough to add that flag.
     *
     * If the column property is not present in knex's methods it will be ignored.
     * See <a href="http://knexjs.org/#Schema-Building">knex's documentation</a>
     * on Schema Building for the available attributes when creating column tables.
     *
     * @param {string} tableName
     * @param {Object[]} columns
     * @param {Object} [options={}]
     * @param {string[]} [options.compositeKey]
     *  An array of column names as strings. A composite primary key will be
     *  created on all of these columns.
     * @returns {Promise}
     *
     * @example
     *
     * // `columns` should be an Array
     * // each item in the Array should be either a string or an Object
     *
     * // a string in the Array defaults to a text column in the table
     * db.createTable('people', ['email'])
     *
     * // use an object to specify other attributes
     * db.createTable('people', [
     *   { name: 'age', type: 'integer' }
     * ])
     *
     * // you can mix and match
     * db.createTable('people', [
     *   'name',
     *   { name: 'age', type: 'integer' },
     *   'email',
     *   // note that the value of `primary` doesn't make a difference
     *   // this would still be a primary key column
     *   { name: '', primary: false }
     * ])
     */

  }, {
    key: 'createTable',
    value: function () {
      var _ref3 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee3(tableName, columns) {
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var query;
        return _regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(!Array.isArray(columns) || !columns.length)) {
                  _context3.next = 2;
                  break;
                }

                return _context3.abrupt('return', this._errorHandler('#createTable', '\'columns\' must be an array'));

              case 2:
                query = this.sb.createTableIfNotExists(tableName, function (table) {
                  each(columns, function (column) {
                    if (isPlainObject(column)) {
                      var _ret = function () {
                        if (!column.name) return {
                            v: void 0
                          };
                        if (!column.type || !(column.type in table)) column.type = 'text';
                        if ('unique' in column && column.unique === 'inline') {
                          // bypass knex's usual unique method
                          column['__TYPE__'] = column.type + ' unique';
                          column.type = 'specificType';
                          delete column.unique;
                        }

                        var partial = table[column.type](column.name, column['__TYPE__']);
                        each(column, function (attr, prop) {
                          // name & type are handled above
                          if (prop === 'name' || prop === 'type') return;
                          if (!(prop in partial)) return;

                          // handle methods that take no arguments
                          switch (prop) {
                            case 'unique':
                            case 'primary':
                            case 'notNull':
                            case 'notNullable':
                            case 'nullable':
                            case 'unsigned':
                              partial = partial[prop]();
                              break;
                            default:
                              partial = partial[prop](attr);
                          }
                        });
                      }();

                      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                    } else if (isString(column)) {
                      table.text(column);
                    }
                  });

                  if ('compositeKey' in options) {
                    table.primary(options.compositeKey);
                  }
                });
                _context3.prev = 3;
                _context3.next = 6;
                return this.run(query);

              case 6:
                _context3.next = 11;
                break;

              case 8:
                _context3.prev = 8;
                _context3.t0 = _context3['catch'](3);
                return _context3.abrupt('return', this._errorHandler(_context3.t0));

              case 11:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[3, 8]]);
      }));

      function createTable(_x4, _x5, _x6) {
        return _ref3.apply(this, arguments);
      }

      return createTable;
    }()

    /**
     * Check if a table exists in the database
     * @param {string} tableName
     * @returns {Promise<boolean>}
     */

  }, {
    key: 'hasTable',
    value: function () {
      var _ref4 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee4(tableName) {
        var res;
        return _regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.prev = 0;
                _context4.next = 3;
                return this.count('sqlite_master', 'name', {
                  name: tableName
                });

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

      function hasTable(_x8) {
        return _ref4.apply(this, arguments);
      }

      return hasTable;
    }()

    /**
     * Remove a table from the database
     * @param {string} tableName
     * @returns {Promise<boolean>}
     */

  }, {
    key: 'dropTable',
    value: function () {
      var _ref5 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee5(tableName) {
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.prev = 0;
                _context5.next = 3;
                return this.run(this.sb.dropTable(tableName));

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

      function dropTable(_x9) {
        return _ref5.apply(this, arguments);
      }

      return dropTable;
    }()

    /**
     * Insert values into a table in the database.
     *
     * @param {string} tableName
     * @param {Object} values
     * @param {Object} [options={}]
     * @param {string} [options.conflict]
     *  An SQLite conflict type, one of: `fail`, `abort`, `ignore`,
     *  `replace`, `rollback`.
     * @returns {Promise<number>} The number of rows inserted
     *
     * @example
     *
     * db.insert('people', {
     *   name: 'Bob',
     *   age: 17
     * })
     *
     * // insert or replace
     * db.insert('people', {
     *   name: 'Bob',
     *   age: 17
     * }, { conflict: 'replace' })
     */

  }, {
    key: 'insert',
    value: function () {
      var _ref6 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee6(tableName, values) {
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var query, str;
        return _regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(!tableName || !isString(tableName))) {
                  _context6.next = 2;
                  break;
                }

                return _context6.abrupt('return', this._errorHandler('#insert', '\'tableName\' must be a string'));

              case 2:

                each(values, function (v, k) {
                  if (typeof v === 'boolean') values[k] = '' + v;
                });

                query = this.knex.table(tableName).insert(values);

                // Knex doesn't have support for conflict clauses yet :(

                if (options.conflict) {
                  str = Trilogy._getConflictString(options.conflict);

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

      function insert(_x10, _x11, _x12) {
        return _ref6.apply(this, arguments);
      }

      return insert;
    }()

    /**
     * Execute a select query on the database. Allows overloading of arguments,
     * ie. `table` is the only required argument. In this case, `columns`
     * defaults to selecting all columns.
     *
     * @function
     * @name select
     * @memberOf Trilogy#
     *
     * @param {string} table
     * @param {(string|Array)} [columns=['*']]
     *  Defaults to selecting all columns.
     * @param {(Object|Array|Function)} [where=['1', '=', '1']]
     *  Defaults to no restriction on selection.
     * @param {Object} [options={}]
     * @param {boolean} [options.random=false]
     *  Pass `true` to return records in random order.
     * @returns {Promise<Array>}
     *
     * @example
     *
     * // select all records in the 'people' table
     * db.select('people')
     *
     * // select just the 'age' and 'favColor' columns where name is 'Bob'
     * db.select('people', ['age', 'favColor'], { name: 'Bob' })
     *
     * // select just 'name' where age is at least 18
     * db.select('people', 'age', ['age', '>=', '18'])
     */

    /**
     * @private
     */

  }, {
    key: 'select',
    value: function () {
      var _ref7 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee8() {
        var _this = this;

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
                    description: 'a string or an array of strings',
                    defaultValue: ['*']
                  }).add('where', {
                    test: function test(value) {
                      return Trilogy._isValidWhere(value);
                    },
                    description: 'an object, array, or function',
                    defaultValue: ['1', '=', '1']
                  });

                  v.form('table', '?columns', '?where', '?options');
                }, function () {
                  var _ref8 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee7(args) {
                    var columns, partial, query, result;
                    return _regeneratorRuntime.wrap(function _callee7$(_context7) {
                      while (1) {
                        switch (_context7.prev = _context7.next) {
                          case 0:
                            columns = Trilogy._sanitizeColumns(args.columns);
                            partial = _this.knex.column(columns).table(args.table);
                            query = Trilogy._sanitizeWhere(args.where, partial);


                            if (args.options.random) {
                              query = query.orderByRaw('RANDOM()');
                            } else if (args.options.order) {
                              query = Trilogy._sanitizeOrder(args.options.order, partial);
                            }

                            _context7.prev = 4;
                            _context7.next = 7;
                            return _this.exec(query);

                          case 7:
                            result = _context7.sent;
                            return _context7.abrupt('return', Trilogy._parseResponse(result));

                          case 11:
                            _context7.prev = 11;
                            _context7.t0 = _context7['catch'](4);

                            if (!_context7.t0.message.endsWith('of undefined')) {
                              _context7.next = 15;
                              break;
                            }

                            return _context7.abrupt('return');

                          case 15:
                            return _context7.abrupt('return', _this._errorHandler(_context7.t0));

                          case 16:
                          case 'end':
                            return _context7.stop();
                        }
                      }
                    }, _callee7, _this, [[4, 11]]);
                  }));

                  return function (_x15) {
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

      function select(_x14) {
        return _ref7.apply(this, arguments);
      }

      return select;
    }()

    /**
     * Return the first row selected by the query. Allows overloading
     * of arguments, ie. `table` is the only required argument. In this
     * case, `columns` defaults to selecting all columns.
     *
     * @function
     * @name first
     * @memberOf Trilogy#
     *
     * @param {string} table
     * @param {(string|Array)} [columns=['*']]
     *  Defaults to selecting all columns.
     * @param {(Object|Array|Function)} [where=['1', '=', '1']]
     *  Defaults to no restriction on selection.
     * @param {Object} [options={}]
     * @param {boolean} [options.random=false]
     *  Pass `true` to return a random record.
     * @returns {Promise<Object>}
     *
     * @example
     *
     * // select the first record in 'people'
     * db.first('people')
     *
     * // select a random record from 'people'
     * // the second argument is a where clause but is always true for all records
     * db.first('people', ['1', '=', '1'], { random: true })
     *
     * // NOTE:
     * // even with overloading, in this case `where` needs to be provided if we
     * // have an `options` object. this is because `where` could also be an object
     * // so the function has no way to know which one you meant to provide.
     */

    /**
     * @private
     */

  }, {
    key: 'first',
    value: function () {
      var _ref9 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee10() {
        var _this2 = this;

        var _args10 = arguments;
        return _regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                return _context10.abrupt('return', arify(function (v) {
                  v.str('table').obj('options', { random: false }).add('columns', {
                    test: function test(value) {
                      return Array.isArray(value) || isString(value);
                    },
                    description: 'a string or an array of strings',
                    defaultValue: ['*']
                  }).add('where', {
                    test: function test(value) {
                      return Trilogy._isValidWhere(value);
                    },
                    description: 'an object, array, or function',
                    defaultValue: ['1', '=', '1']
                  });

                  v.form('table', '?columns', '?where', '?options');
                }, function () {
                  var _ref10 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee9(args) {
                    var columns, partial, query, result;
                    return _regeneratorRuntime.wrap(function _callee9$(_context9) {
                      while (1) {
                        switch (_context9.prev = _context9.next) {
                          case 0:
                            columns = Trilogy._sanitizeColumns(args.columns);
                            partial = _this2.knex.table(args.table).first(columns);
                            query = Trilogy._sanitizeWhere(args.where, partial);


                            if (args.options.random) {
                              query = query.orderByRaw('RANDOM()');
                            }

                            _context9.prev = 4;
                            _context9.next = 7;
                            return _this2.exec(query);

                          case 7:
                            result = _context9.sent;
                            return _context9.abrupt('return', Trilogy._parseResponse(result)[0]);

                          case 11:
                            _context9.prev = 11;
                            _context9.t0 = _context9['catch'](4);

                            if (!_context9.t0.message.endsWith('of undefined')) {
                              _context9.next = 15;
                              break;
                            }

                            return _context9.abrupt('return');

                          case 15:
                            return _context9.abrupt('return', _this2._errorHandler(_context9.t0));

                          case 16:
                          case 'end':
                            return _context9.stop();
                        }
                      }
                    }, _callee9, _this2, [[4, 11]]);
                  }));

                  return function (_x17) {
                    return _ref10.apply(this, arguments);
                  };
                }()).apply(undefined, _args10));

              case 1:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function first(_x16) {
        return _ref9.apply(this, arguments);
      }

      return first;
    }()

    /**
     * Retrieve the value at a specific row in a specific column.
     * Allows function overloading, ie. `table` is the only required
     * argument. In this case, `column` must be provided as dot- or
     * bracket-notation syntax of `table.column` or `table[column]`.
     *
     * @function
     * @name getValue
     * @memberOf Trilogy#
     *
     * @param {string} table
     * @param {string} [column]
     *  If this argument is not explicitly provided, it must be
     *  included as part of `tableName` using either dot- or
     *  bracket-notation.
     * @param {(Object|Array|Function)} [where=['1', '=', '1']]
     *  Defaults to no restriction on selection.
     * @returns {Promise<*>}
     *
     * @example
     *
     * db.getValue('people', 'age', { name: 'Bob' })
     *
     * // dot- or bracket-notation of table and column
     * db.getValue('people.age', { name: 'Bob' })
     * db.getValue('people[age]', { name: 'Bob' })
     */

    /**
     * @private
     */

  }, {
    key: 'getValue',
    value: function () {
      var _ref11 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee12() {
        var _this3 = this;

        var _args12 = arguments;
        return _regeneratorRuntime.wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                return _context12.abrupt('return', arify(function (v) {
                  v.str('table').str('column').add('where', {
                    test: function test(value) {
                      return Trilogy._isValidWhere(value);
                    },
                    description: 'an object, array, or function',
                    defaultValue: ['1', '=', '1']
                  });

                  v.form('table', '?column', 'where');
                }, function () {
                  var _ref12 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee11(args) {
                    var _Trilogy$_parseTableP, _Trilogy$_parseTableP2, tbl, col, partial, query, result;

                    return _regeneratorRuntime.wrap(function _callee11$(_context11) {
                      while (1) {
                        switch (_context11.prev = _context11.next) {
                          case 0:
                            _Trilogy$_parseTableP = Trilogy._parseTablePath(args.table, args.column);
                            _Trilogy$_parseTableP2 = _slicedToArray(_Trilogy$_parseTableP, 2);
                            tbl = _Trilogy$_parseTableP2[0];
                            col = _Trilogy$_parseTableP2[1];

                            if (col) {
                              _context11.next = 6;
                              break;
                            }

                            return _context11.abrupt('return', _this3._errorHandler(constants.ERR_COL_MISSING));

                          case 6:
                            partial = _this3.knex.table(tbl).first(col);
                            query = Trilogy._sanitizeWhere(args.where, partial);
                            _context11.prev = 8;
                            _context11.next = 11;
                            return _this3.exec(query);

                          case 11:
                            result = _context11.sent;
                            return _context11.abrupt('return', Trilogy._parseResponse(result)[0][col]);

                          case 15:
                            _context11.prev = 15;
                            _context11.t0 = _context11['catch'](8);

                            if (!_context11.t0.message.endsWith('of undefined')) {
                              _context11.next = 19;
                              break;
                            }

                            return _context11.abrupt('return');

                          case 19:
                            return _context11.abrupt('return', _this3._errorHandler(_context11.t0));

                          case 20:
                          case 'end':
                            return _context11.stop();
                        }
                      }
                    }, _callee11, _this3, [[8, 15]]);
                  }));

                  return function (_x19) {
                    return _ref12.apply(this, arguments);
                  };
                }()).apply(undefined, _args12));

              case 1:
              case 'end':
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function getValue(_x18) {
        return _ref11.apply(this, arguments);
      }

      return getValue;
    }()

    /**
     * Update rows in the database.
     *
     * @function
     * @name update
     * @memberOf Trilogy#
     *
     * @param {string} table
     * @param {(Object|Array)} values
     *  Must either be an object or a key / value array (length === 2)
     * @param {(Object|Array|Function)} [where=['1', '=', '1']]
     *  Defaults to no restriction on selection.
     * @param {Object} [options={}]
     * @param {string} [options.conflict]
     *  An SQLite conflict type, one of: `fail`, `abort`, `ignore`,
     *  `replace`, `rollback`.
     * @returns {Promise<number>} The number of rows affected
     *
     * @example
     *
     * db.update('people', { age: 18 }, { name: 'Bob' })
     */

    /**
     * @private
     */

  }, {
    key: 'update',
    value: function () {
      var _ref13 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee14() {
        var _this4 = this;

        var _args14 = arguments;
        return _regeneratorRuntime.wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                return _context14.abrupt('return', arify(function (v) {
                  v.str('table').obj('options', {}).add('values', {
                    test: function test(value) {
                      return isPlainObject(value) || Array.isArray(value) && value.length === 2;
                    },
                    description: 'either an Object or an Array with a length of 2'
                  }).add('where', {
                    test: function test(value) {
                      return Trilogy._isValidWhere(value);
                    },
                    description: 'an object, array, or function',
                    defaultValue: ['1', '=', '1']
                  });

                  v.form('table', 'values', '?where', '?options');
                }, function () {
                  var _ref14 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee13(args) {
                    var partial, update, arr, query, str;
                    return _regeneratorRuntime.wrap(function _callee13$(_context13) {
                      while (1) {
                        switch (_context13.prev = _context13.next) {
                          case 0:
                            partial = _this4.knex.table(args.table);
                            update = void 0;

                            if (isPlainObject(args.values)) {
                              each(args.values, function (v, k) {
                                if (typeof v === 'boolean') args.values[k] = '' + v;
                              });
                              update = partial.update(args.values);
                            } else {
                              arr = args.values.map(function (v) {
                                return typeof v === 'boolean' ? '' + v : v;
                              });

                              update = partial.update.apply(partial, _toConsumableArray(arr));
                            }

                            query = Trilogy._sanitizeWhere(args.where, update);

                            // Knex doesn't have support for conflict clauses yet :(

                            if (args.options.conflict) {
                              str = Trilogy._getConflictString(args.options.conflict);

                              query = query.toString().replace('update', 'update' + str);
                            }

                            _context13.prev = 5;
                            _context13.next = 8;
                            return _this4.run(query);

                          case 8:
                            return _context13.abrupt('return', _this4.db.getRowsModified());

                          case 11:
                            _context13.prev = 11;
                            _context13.t0 = _context13['catch'](5);
                            return _context13.abrupt('return', _this4._errorHandler(_context13.t0));

                          case 14:
                          case 'end':
                            return _context13.stop();
                        }
                      }
                    }, _callee13, _this4, [[5, 11]]);
                  }));

                  return function (_x21) {
                    return _ref14.apply(this, arguments);
                  };
                }()).apply(undefined, _args14));

              case 1:
              case 'end':
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function update(_x20) {
        return _ref13.apply(this, arguments);
      }

      return update;
    }()

    /**
     * Increment a value at `column` by a specified `amount`.
     * Allows function overloading, ie. `table` is the only
     * required argument. In that case, column must be provided
     * as part of `table` using dot- or bracket-notation. This
     * allows for a short-and-sweet syntax in the case you only
     * want to increment by 1.
     *
     * @function
     * @name increment
     * @memberOf Trilogy#
     *
     * @param {string} table
     * @param {string} [column]
     *  If this argument is not explicitly provided, it must be
     *  included as part of `tableName` using either dot- or
     *  bracket-notation.
     * @param {number} [amount=1]
     * @param {(Object|Array|Function)} [where=['1', '=', '1']]
     *  Defaults to no restriction on selection.
     * @returns {Promise}
     *
     * @example
     *
     * db.increment('people', 'age', 1, { name: 'Bob' })
     *
     * // we can make that much sweeter :)
     * db.increment('people.age', { name: 'Bob' })
     */

    /**
     * @private
     */

  }, {
    key: 'increment',
    value: function () {
      var _ref15 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee16() {
        var _this5 = this;

        var _args16 = arguments;
        return _regeneratorRuntime.wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                return _context16.abrupt('return', arify(function (v) {
                  v.str('table').str('column').num('amount', 1).add('where', {
                    test: function test(value) {
                      return Trilogy._isValidWhere(value);
                    },
                    description: 'an object, array, or function',
                    defaultValue: ['1', '=', '1']
                  });

                  v.form('table', '?column', '?amount', '?where');
                }, function () {
                  var _ref16 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee15(args) {
                    var _Trilogy$_parseTableP3, _Trilogy$_parseTableP4, tbl, col, partial, query;

                    return _regeneratorRuntime.wrap(function _callee15$(_context15) {
                      while (1) {
                        switch (_context15.prev = _context15.next) {
                          case 0:
                            _Trilogy$_parseTableP3 = Trilogy._parseTablePath(args.table, args.column);
                            _Trilogy$_parseTableP4 = _slicedToArray(_Trilogy$_parseTableP3, 2);
                            tbl = _Trilogy$_parseTableP4[0];
                            col = _Trilogy$_parseTableP4[1];

                            if (col) {
                              _context15.next = 6;
                              break;
                            }

                            return _context15.abrupt('return', _this5._errorHandler(constants.ERR_COL_MISSING));

                          case 6:
                            partial = _this5.knex.table(tbl).increment(col, args.amount);
                            query = Trilogy._sanitizeWhere(args.where, partial);
                            _context15.prev = 8;
                            _context15.next = 11;
                            return _this5.run(query);

                          case 11:
                            _context15.next = 16;
                            break;

                          case 13:
                            _context15.prev = 13;
                            _context15.t0 = _context15['catch'](8);
                            return _context15.abrupt('return', _this5._errorHandler(_context15.t0));

                          case 16:
                          case 'end':
                            return _context15.stop();
                        }
                      }
                    }, _callee15, _this5, [[8, 13]]);
                  }));

                  return function (_x23) {
                    return _ref16.apply(this, arguments);
                  };
                }()).apply(undefined, _args16));

              case 1:
              case 'end':
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function increment(_x22) {
        return _ref15.apply(this, arguments);
      }

      return increment;
    }()

    /**
     * Decrement a value at `column` by a specified `amount`.
     * Allows function overloading, ie. `table` is the only
     * required argument. In that case, column must be provided
     * as part of `table` using dot- or bracket-notation. This
     * allows for a short-and-sweet syntax in the case you only
     * want to decrement by 1.
     *
     * @function
     * @name decrement
     * @memberOf Trilogy#
     *
     * @param {string} table
     * @param {string} [column]
     *  If this argument is not explicitly provided, it must be
     *  included as part of `tableName` using either dot- or
     *  bracket-notation.
     * @param {(Object|Array|Function)} [where=['1', '=', '1']]
     *  Defaults to no restriction on selection.
     * @param {boolean} allowNegative
     *  Unless set to `true`, the value will not be allowed to go
     *  below a value of `0`.
     * @returns {Promise}
     *
     * db.decrement('people', 'age', 1, { name: 'Bob' })
     *
     * // we can make that much sweeter :)
     * db.decrement('people.age', { name: 'Bob' })
     */

    /**
     * @private
     */

  }, {
    key: 'decrement',
    value: function () {
      var _ref17 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee18() {
        var _this6 = this;

        var _args18 = arguments;
        return _regeneratorRuntime.wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                return _context18.abrupt('return', arify(function (v) {
                  v.str('table').str('column').num('amount', 1).bln('allowNegative', false).add('where', {
                    test: function test(value) {
                      return Trilogy._isValidWhere(value);
                    },
                    description: 'an object, array, or function',
                    defaultValue: ['1', '=', '1']
                  });

                  v.form('table', '?column', '?amount', '?where', '?allowNegative');
                }, function () {
                  var _ref18 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee17(args) {
                    var _Trilogy$_parseTableP5, _Trilogy$_parseTableP6, tbl, col, partial, rawStr, updated, query;

                    return _regeneratorRuntime.wrap(function _callee17$(_context17) {
                      while (1) {
                        switch (_context17.prev = _context17.next) {
                          case 0:
                            _Trilogy$_parseTableP5 = Trilogy._parseTablePath(args.table, args.column);
                            _Trilogy$_parseTableP6 = _slicedToArray(_Trilogy$_parseTableP5, 2);
                            tbl = _Trilogy$_parseTableP6[0];
                            col = _Trilogy$_parseTableP6[1];

                            if (col) {
                              _context17.next = 6;
                              break;
                            }

                            return _context17.abrupt('return', _this6._errorHandler(constants.ERR_COL_MISSING));

                          case 6:
                            partial = _this6.knex.table(tbl);
                            rawStr = args.allowNegative ? col + ' - ' + args.amount : 'MAX(0, ' + col + ' - ' + args.amount + ')';
                            updated = partial.update(_defineProperty({}, col, _this6.knex.raw(rawStr)));
                            query = Trilogy._sanitizeWhere(args.where, updated);
                            _context17.prev = 10;
                            _context17.next = 13;
                            return _this6.run(query);

                          case 13:
                            _context17.next = 18;
                            break;

                          case 15:
                            _context17.prev = 15;
                            _context17.t0 = _context17['catch'](10);
                            return _context17.abrupt('return', _this6._errorHandler(_context17.t0));

                          case 18:
                          case 'end':
                            return _context17.stop();
                        }
                      }
                    }, _callee17, _this6, [[10, 15]]);
                  }));

                  return function (_x25) {
                    return _ref18.apply(this, arguments);
                  };
                }()).apply(undefined, _args18));

              case 1:
              case 'end':
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function decrement(_x24) {
        return _ref17.apply(this, arguments);
      }

      return decrement;
    }()

    /**
     * Delete rows from a table. Allows deletion of all records in
     * a table by passing only a table name.
     *
     * @function
     * @name del
     * @memberOf Trilogy#
     *
     * @param {string} table
     * @param {(Object|Array|Function)} [where=['1','=','1']]
     *  Defaults to no restriction on selection.
     * @returns {Promise<number>} The number of rows deleted
     *
     * @example
     *
     * // delete all records from 'people'
     * db.del('people')
     *
     * // delete only where age is under 21
     * db.del('people', ['age', '<', '21'])
     */

    /**
     * @private
     */

  }, {
    key: 'del',
    value: function () {
      var _ref19 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee20() {
        var _this7 = this;

        var _args20 = arguments;
        return _regeneratorRuntime.wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                return _context20.abrupt('return', arify(function (v) {
                  v.str('table').add('where', {
                    test: function test(value) {
                      return Trilogy._isValidWhere(value);
                    },
                    description: 'an object, array, or function',
                    defaultValue: ['1', '=', '1']
                  });

                  v.form('table', '?where');
                }, function () {
                  var _ref20 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee19(args) {
                    var partial, query;
                    return _regeneratorRuntime.wrap(function _callee19$(_context19) {
                      while (1) {
                        switch (_context19.prev = _context19.next) {
                          case 0:
                            partial = _this7.knex.table(args.table).del();
                            query = Trilogy._sanitizeWhere(args.where, partial);
                            _context19.prev = 2;
                            _context19.next = 5;
                            return _this7.run(query);

                          case 5:
                            return _context19.abrupt('return', _this7.db.getRowsModified());

                          case 8:
                            _context19.prev = 8;
                            _context19.t0 = _context19['catch'](2);
                            return _context19.abrupt('return', _this7._errorHandler(_context19.t0));

                          case 11:
                          case 'end':
                            return _context19.stop();
                        }
                      }
                    }, _callee19, _this7, [[2, 8]]);
                  }));

                  return function (_x27) {
                    return _ref20.apply(this, arguments);
                  };
                }()).apply(undefined, _args20));

              case 1:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20, this);
      }));

      function del(_x26) {
        return _ref19.apply(this, arguments);
      }

      return del;
    }()

    /**
     * Return the number of rows, matching a criteria if specified.
     *
     * @function
     * @name count
     * @memberOf Trilogy#
     *
     * @param {string} table
     * @param {String} [column='*']
     *  Defaults to selecting all columns.
     * @param {(Object|Array|Function)} [where=['1','=','1']]
     *  Defaults to no restriction on selection.
     * @param {Object} [options={}]
     * @param {boolean} [options.distinct=false]
     *  Counts only unique values if `true`.
     * @returns {Promise<number>} The number of rows (meeting criteria if supplied)
     *
     * @example
     *
     * // given we have this data in our 'people' table:
     * // |  name   |   age   |
     * // |  Bob    |   18    |
     * // |  Dale   |   25    |
     * // |  Harry  |   32    |
     *
     * db.count('people')
     * // -> 3
     *
     * // given we have tables `people`, `places`, `things`, & `ideas`
     * // thanks to function overloading we can do this
     * // to count number of tables in the database:
     *
     * db.count()
     * // -> 4
     */

    /**
     * @private
     */

  }, {
    key: 'count',
    value: function count() {
      var _this8 = this;

      return arify(function (v) {
        v.str('table', 'sqlite_master').str('column', '*').obj('options', { distinct: false }).add('where', {
          test: function test(value) {
            return Trilogy._isValidWhere(value);
          },
          description: 'an object, array, or function',
          defaultValue: ['1', '=', '1']
        });

        v.form('?table', '?column', '?where', '?options');
      }, function (args) {
        var partial = void 0;
        if (args.options.distinct) {
          partial = _this8.knex.table(args.table).countDistinct(args.column + ' as count');
        } else {
          partial = _this8.knex.table(args.table).count(args.column + ' as count');
        }

        var query = Trilogy._sanitizeWhere(args.where, partial).toString();

        try {
          var statement = _this8.db.prepare(query);
          var res = statement.getAsObject({});

          if (isPlainObject(res) && 'count' in res) {
            return res.count;
          } else {
            return 0;
          }
        } catch (e) {
          return _this8._errorHandler(e);
        }
      }).apply(undefined, arguments);
    }

    /**
     * Execute arbitrary SQLite queries. You can either write your
     * own queries as you would with typical SQLite, or you can build
     * them with knex and use the knex `toString` method before passing
     * it here.
     *
     * Pass `true` as the second argument to return the results, otherwise
     * the query will be assumed to be execution only.
     *
     * @param {string} query
     *  Any arbitrary SQLite query string
     * @param {boolean} ret
     *  Pass `true` to return the results of the query
     * @returns {Promise<(Object|undefined)>}
     */

  }, {
    key: 'raw',
    value: function () {
      var _ref21 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee21(query) {
        var ret = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        var done;
        return _regeneratorRuntime.wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                _context21.prev = 0;
                done = ret ? this.exec(query) : this.run(query);
                return _context21.abrupt('return', ret ? done : undefined);

              case 5:
                _context21.prev = 5;
                _context21.t0 = _context21['catch'](0);
                return _context21.abrupt('return', this._errorHandler(_context21.t0));

              case 8:
              case 'end':
                return _context21.stop();
            }
          }
        }, _callee21, this, [[0, 5]]);
      }));

      function raw(_x28, _x29) {
        return _ref21.apply(this, arguments);
      }

      return raw;
    }()

    /**
     * Exposes the Knex schema builder object
     * @returns {Object}
     *
     * @see {@link Trilogy#raw} to run queries built with this
     */

  }, {
    key: 'getSchemaBuilder',
    value: function getSchemaBuilder() {
      /**
       * @prop sb
       * @type {Object}
       * @memberOf this
       */
      return this.sb;
    }

    /**
     * Exposes the Knex query builder object
     * @returns {Object}
     *
     * @see {@link Trilogy#raw} to run queries built with this
     */

  }, {
    key: 'getQueryBuilder',
    value: function getQueryBuilder() {
      return this.knex;
    }

    /**
     * Build an 'on conflict' clause query component
     * @param {string} conflict - the type of query to build
     * @returns {string} query component
     * @static
     * @private
     */

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
  }], [{
    key: '_getConflictString',
    value: function _getConflictString(conflict) {
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

    /**
     * Parse an sql.js return value into a sane JS array
     * @param {Array} contents
     * @returns {Array}
     * @static
     * @private
     */

  }, {
    key: '_parseResponse',
    value: function _parseResponse(contents) {
      if (contents.length) {
        var columns = contents[0].columns;
        var values = contents[0].values;
        var results = [];
        for (var i = 0; i < values.length; i++) {
          var line = {};
          for (var j = 0; j < columns.length; j++) {
            line[columns[j]] = Trilogy._stringToBoolean(values[i][j]);
          }
          results.push(line);
        }
        return results;
      } else {
        return [];
      }
    }

    /**
     * Check that a where argument is a valid type
     * Valid types are: Object | Array | Function
     * @param {*} where
     * @returns {boolean}
     * @static
     * @private
     */

  }, {
    key: '_isValidWhere',
    value: function _isValidWhere(where) {
      if (isPlainObject(where)) return true;

      if (Array.isArray(where)) {
        var len = where.length;
        return len === 2 || len === 3;
      }

      return isFunction(where);
    }

    /**
     * Normalize a columns argument to an Array
     * Returns ['*'] if the input is not a string or Array
     * This means it defaults to 'all columns'
     * @param {*} columns
     * @returns {Array}
     * @static
     * @private
     */

  }, {
    key: '_sanitizeColumns',
    value: function _sanitizeColumns(columns) {
      if (Array.isArray(columns)) return columns;
      if (isString(columns)) return [columns];
      return ['*'];
    }

    /**
     * Complete a where query component based on type
     * Arrays are spread into arguments
     * Functions get bound to the knex instance
     * Objects are passed along as is
     * @param {(Object|Array|Function)} where
     * @param {Object} partial - the current knex query chain
     * @returns {Object} a continued knex query chain
     * @static
     * @private
     */

  }, {
    key: '_sanitizeWhere',
    value: function _sanitizeWhere(where, partial) {
      if (Array.isArray(where)) {
        var arr = where.map(Trilogy._booleanToString);
        return partial.where.apply(partial, _toConsumableArray(arr));
      } else if (isFunction(where)) {
        return partial.where(where.bind(partial));
      } else {
        // it's an object
        each(where, function (v, k) {
          where[k] = Trilogy._booleanToString(v);
        });
        return partial.where(where);
      }
    }
  }, {
    key: '_booleanToString',
    value: function _booleanToString(value) {
      return typeof value === 'boolean' ? '' + value : value;
    }
  }, {
    key: '_stringToBoolean',
    value: function _stringToBoolean(value) {
      if (value !== 'true' && value !== 'false') return value;
      return value === 'true';
    }

    /**
     * Complete an 'order by' query component
     * Arrays are spread into arguments
     * Strings are passed along as is
     * @param {(Array|string)} order
     * @param {Object} partial - the current knex query chain
     * @returns {Object} a continued knex query chain
     * @private
     */

  }, {
    key: '_sanitizeOrder',
    value: function _sanitizeOrder(order, partial) {
      if (Array.isArray(order) && order.length === 2) {
        return partial.orderBy.apply(partial, _toConsumableArray(order));
      } else if (isString(order)) {
        return partial.orderBy(order);
      } else {
        return partial;
      }
    }

    /**
     * Parse a dot-notated path into table, column, & row
     * @param {string} table
     * @param {string} column
     * @param {string} row
     * @returns {Array<string>}
     * @private
     */

  }, {
    key: '_parseTablePath',
    value: function _parseTablePath(table, column, row) {
      if (table.includes('.')) {
        var _table$split = table.split('.');

        var _table$split2 = _slicedToArray(_table$split, 3);

        var top = _table$split2[0];
        var inner = _table$split2[1];
        var nested = _table$split2[2];

        return Trilogy._parseTablePath(top, inner, nested);
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

        return Trilogy._parseTablePath(_top, _inner, _nested);
      } else {
        return [table, column, row];
      }
    }
  }]);

  return Trilogy;
}();

export default Trilogy;