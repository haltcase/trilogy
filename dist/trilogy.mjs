import Promise$1 from 'native-or-lie';
import jetpack from 'fs-jetpack';
import arify from 'arify';
import knex from 'knex';
import SQL from 'sql.js';
import map from 'lodash.map';
import isPlainObject from 'is-plain-obj';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {}

function interopDefault(ex) {
	return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var _global = createCommonjsModule(function (module) {
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
});

var _global$1 = interopDefault(_global);


var require$$4 = Object.freeze({
  default: _global$1
});

var require$$4 = Object.freeze({
  default: _global$1
});

var _core = createCommonjsModule(function (module) {
var core = module.exports = {version: '2.4.0'};
if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
});

var _core$1 = interopDefault(_core);
var version = _core.version;

var require$$0$2 = Object.freeze({
	default: _core$1,
	version: version
});

var require$$0$2 = Object.freeze({
	default: _core$1,
	version: version
});

var _aFunction = createCommonjsModule(function (module) {
module.exports = function(it){
  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
  return it;
};
});

var _aFunction$1 = interopDefault(_aFunction);


var require$$1$1 = Object.freeze({
  default: _aFunction$1
});

var require$$1$1 = Object.freeze({
  default: _aFunction$1
});

var _ctx = createCommonjsModule(function (module) {
// optional / simple context binding
var aFunction = interopDefault(require$$1$1);
module.exports = function(fn, that, length){
  aFunction(fn);
  if(that === undefined)return fn;
  switch(length){
    case 1: return function(a){
      return fn.call(that, a);
    };
    case 2: return function(a, b){
      return fn.call(that, a, b);
    };
    case 3: return function(a, b, c){
      return fn.call(that, a, b, c);
    };
  }
  return function(/* ...args */){
    return fn.apply(that, arguments);
  };
};
});

var _ctx$1 = interopDefault(_ctx);


var require$$5 = Object.freeze({
  default: _ctx$1
});

var require$$5 = Object.freeze({
  default: _ctx$1
});

var _isObject = createCommonjsModule(function (module) {
module.exports = function(it){
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};
});

var _isObject$1 = interopDefault(_isObject);


var require$$3 = Object.freeze({
  default: _isObject$1
});

var require$$3 = Object.freeze({
  default: _isObject$1
});

var _anObject = createCommonjsModule(function (module) {
var isObject = interopDefault(require$$3);
module.exports = function(it){
  if(!isObject(it))throw TypeError(it + ' is not an object!');
  return it;
};
});

var _anObject$1 = interopDefault(_anObject);


var require$$2$1 = Object.freeze({
  default: _anObject$1
});

var require$$2$1 = Object.freeze({
  default: _anObject$1
});

var _fails = createCommonjsModule(function (module) {
module.exports = function(exec){
  try {
    return !!exec();
  } catch(e){
    return true;
  }
};
});

var _fails$1 = interopDefault(_fails);


var require$$0$4 = Object.freeze({
  default: _fails$1
});

var require$$0$4 = Object.freeze({
  default: _fails$1
});

var _descriptors = createCommonjsModule(function (module) {
// Thank's IE8 for his funny defineProperty
module.exports = !interopDefault(require$$0$4)(function(){
  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
});
});

var _descriptors$1 = interopDefault(_descriptors);


var require$$1$3 = Object.freeze({
  default: _descriptors$1
});

var require$$1$3 = Object.freeze({
  default: _descriptors$1
});

var _domCreate = createCommonjsModule(function (module) {
var isObject = interopDefault(require$$3)
  , document = interopDefault(require$$4).document
  // in old IE typeof document.createElement is 'object'
  , is = isObject(document) && isObject(document.createElement);
module.exports = function(it){
  return is ? document.createElement(it) : {};
};
});

var _domCreate$1 = interopDefault(_domCreate);


var require$$2$2 = Object.freeze({
  default: _domCreate$1
});

var require$$2$2 = Object.freeze({
  default: _domCreate$1
});

var _ie8DomDefine = createCommonjsModule(function (module) {
module.exports = !interopDefault(require$$1$3) && !interopDefault(require$$0$4)(function(){
  return Object.defineProperty(interopDefault(require$$2$2)('div'), 'a', {get: function(){ return 7; }}).a != 7;
});
});

var _ie8DomDefine$1 = interopDefault(_ie8DomDefine);


var require$$1$2 = Object.freeze({
  default: _ie8DomDefine$1
});

var require$$1$2 = Object.freeze({
  default: _ie8DomDefine$1
});

var _toPrimitive = createCommonjsModule(function (module) {
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = interopDefault(require$$3);
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function(it, S){
  if(!isObject(it))return it;
  var fn, val;
  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
  throw TypeError("Can't convert object to primitive value");
};
});

var _toPrimitive$1 = interopDefault(_toPrimitive);


var require$$3$1 = Object.freeze({
  default: _toPrimitive$1
});

var require$$3$1 = Object.freeze({
  default: _toPrimitive$1
});

var _objectDp = createCommonjsModule(function (module, exports) {
var anObject       = interopDefault(require$$2$1)
  , IE8_DOM_DEFINE = interopDefault(require$$1$2)
  , toPrimitive    = interopDefault(require$$3$1)
  , dP             = Object.defineProperty;

exports.f = interopDefault(require$$1$3) ? Object.defineProperty : function defineProperty(O, P, Attributes){
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if(IE8_DOM_DEFINE)try {
    return dP(O, P, Attributes);
  } catch(e){ /* empty */ }
  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
  if('value' in Attributes)O[P] = Attributes.value;
  return O;
};
});

var _objectDp$1 = interopDefault(_objectDp);
var f = _objectDp.f;

var require$$2 = Object.freeze({
  default: _objectDp$1,
  f: f
});

var require$$2 = Object.freeze({
  default: _objectDp$1,
  f: f
});

var _propertyDesc = createCommonjsModule(function (module) {
module.exports = function(bitmap, value){
  return {
    enumerable  : !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable    : !(bitmap & 4),
    value       : value
  };
};
});

var _propertyDesc$1 = interopDefault(_propertyDesc);


var require$$5$1 = Object.freeze({
  default: _propertyDesc$1
});

var require$$5$1 = Object.freeze({
  default: _propertyDesc$1
});

var _hide = createCommonjsModule(function (module) {
var dP         = interopDefault(require$$2)
  , createDesc = interopDefault(require$$5$1);
module.exports = interopDefault(require$$1$3) ? function(object, key, value){
  return dP.f(object, key, createDesc(1, value));
} : function(object, key, value){
  object[key] = value;
  return object;
};
});

var _hide$1 = interopDefault(_hide);


var require$$0$3 = Object.freeze({
  default: _hide$1
});

var require$$0$3 = Object.freeze({
  default: _hide$1
});

var _export = createCommonjsModule(function (module) {
var global    = interopDefault(require$$4)
  , core      = interopDefault(require$$0$2)
  , ctx       = interopDefault(require$$5)
  , hide      = interopDefault(require$$0$3)
  , PROTOTYPE = 'prototype';

var $export = function(type, name, source){
  var IS_FORCED = type & $export.F
    , IS_GLOBAL = type & $export.G
    , IS_STATIC = type & $export.S
    , IS_PROTO  = type & $export.P
    , IS_BIND   = type & $export.B
    , IS_WRAP   = type & $export.W
    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
    , expProto  = exports[PROTOTYPE]
    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
    , key, own, out;
  if(IS_GLOBAL)source = name;
  for(key in source){
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if(own && key in exports)continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function(C){
      var F = function(a, b, c){
        if(this instanceof C){
          switch(arguments.length){
            case 0: return new C;
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if(IS_PROTO){
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if(type & $export.R && expProto && !expProto[key])hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library` 
module.exports = $export;
});

var _export$1 = interopDefault(_export);


var require$$1 = Object.freeze({
  default: _export$1
});

var require$$1 = Object.freeze({
  default: _export$1
});

var es6_object_defineProperty = createCommonjsModule(function (module) {
var $export = interopDefault(require$$1);
// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
$export($export.S + $export.F * !interopDefault(require$$1$3), 'Object', {defineProperty: interopDefault(require$$2).f});
});

interopDefault(es6_object_defineProperty);

var defineProperty$3 = createCommonjsModule(function (module) {
var $Object = interopDefault(require$$0$2).Object;
module.exports = function defineProperty(it, key, desc){
  return $Object.defineProperty(it, key, desc);
};
});

var defineProperty$4 = interopDefault(defineProperty$3);


var require$$0$1 = Object.freeze({
  default: defineProperty$4
});

var require$$0$1 = Object.freeze({
  default: defineProperty$4
});

var defineProperty$1 = createCommonjsModule(function (module) {
module.exports = { "default": interopDefault(require$$0$1), __esModule: true };
});

var defineProperty$2 = interopDefault(defineProperty$1);


var require$$0 = Object.freeze({
	default: defineProperty$2
});

var require$$0 = Object.freeze({
	default: defineProperty$2
});

var defineProperty = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

var _defineProperty = interopDefault(require$$0);

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (obj, key, value) {
  if (key in obj) {
    (0, _defineProperty2.default)(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};
});

var _defineProperty = interopDefault(defineProperty);

var _toInteger = createCommonjsModule(function (module) {
// 7.1.4 ToInteger
var ceil  = Math.ceil
  , floor = Math.floor;
module.exports = function(it){
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};
});

var _toInteger$1 = interopDefault(_toInteger);


var require$$0$7 = Object.freeze({
  default: _toInteger$1
});

var require$$0$7 = Object.freeze({
  default: _toInteger$1
});

var _defined = createCommonjsModule(function (module) {
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function(it){
  if(it == undefined)throw TypeError("Can't call method on  " + it);
  return it;
};
});

var _defined$1 = interopDefault(_defined);


var require$$0$8 = Object.freeze({
  default: _defined$1
});

var require$$0$8 = Object.freeze({
  default: _defined$1
});

var _stringAt = createCommonjsModule(function (module) {
var toInteger = interopDefault(require$$0$7)
  , defined   = interopDefault(require$$0$8);
// true  -> String#at
// false -> String#codePointAt
module.exports = function(TO_STRING){
  return function(that, pos){
    var s = String(defined(that))
      , i = toInteger(pos)
      , l = s.length
      , a, b;
    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};
});

var _stringAt$1 = interopDefault(_stringAt);


var require$$1$4 = Object.freeze({
  default: _stringAt$1
});

var require$$1$4 = Object.freeze({
  default: _stringAt$1
});

var _library = createCommonjsModule(function (module) {
module.exports = true;
});

var _library$1 = interopDefault(_library);


var require$$19 = Object.freeze({
	default: _library$1
});

var require$$19 = Object.freeze({
	default: _library$1
});

var _redefine = createCommonjsModule(function (module) {
module.exports = interopDefault(require$$0$3);
});

var _redefine$1 = interopDefault(_redefine);


var require$$25 = Object.freeze({
	default: _redefine$1
});

var require$$25 = Object.freeze({
	default: _redefine$1
});

var _has = createCommonjsModule(function (module) {
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function(it, key){
  return hasOwnProperty.call(it, key);
};
});

var _has$1 = interopDefault(_has);


var require$$2$3 = Object.freeze({
  default: _has$1
});

var require$$2$3 = Object.freeze({
  default: _has$1
});

var _iterators = createCommonjsModule(function (module) {
module.exports = {};
});

var _iterators$1 = interopDefault(_iterators);


var require$$1$5 = Object.freeze({
	default: _iterators$1
});

var require$$1$5 = Object.freeze({
	default: _iterators$1
});

var _cof = createCommonjsModule(function (module) {
var toString = {}.toString;

module.exports = function(it){
  return toString.call(it).slice(8, -1);
};
});

var _cof$1 = interopDefault(_cof);


var require$$0$10 = Object.freeze({
  default: _cof$1
});

var require$$0$10 = Object.freeze({
  default: _cof$1
});

var _iobject = createCommonjsModule(function (module) {
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = interopDefault(require$$0$10);
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
  return cof(it) == 'String' ? it.split('') : Object(it);
};
});

var _iobject$1 = interopDefault(_iobject);


var require$$1$7 = Object.freeze({
  default: _iobject$1
});

var require$$1$7 = Object.freeze({
  default: _iobject$1
});

var _toIobject = createCommonjsModule(function (module) {
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = interopDefault(require$$1$7)
  , defined = interopDefault(require$$0$8);
module.exports = function(it){
  return IObject(defined(it));
};
});

var _toIobject$1 = interopDefault(_toIobject);


var require$$4$2 = Object.freeze({
  default: _toIobject$1
});

var require$$4$2 = Object.freeze({
  default: _toIobject$1
});

var _toLength = createCommonjsModule(function (module) {
// 7.1.15 ToLength
var toInteger = interopDefault(require$$0$7)
  , min       = Math.min;
module.exports = function(it){
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};
});

var _toLength$1 = interopDefault(_toLength);


var require$$1$9 = Object.freeze({
  default: _toLength$1
});

var require$$1$9 = Object.freeze({
  default: _toLength$1
});

var _toIndex = createCommonjsModule(function (module) {
var toInteger = interopDefault(require$$0$7)
  , max       = Math.max
  , min       = Math.min;
module.exports = function(index, length){
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};
});

var _toIndex$1 = interopDefault(_toIndex);


var require$$0$11 = Object.freeze({
  default: _toIndex$1
});

var require$$0$11 = Object.freeze({
  default: _toIndex$1
});

var _arrayIncludes = createCommonjsModule(function (module) {
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = interopDefault(require$$4$2)
  , toLength  = interopDefault(require$$1$9)
  , toIndex   = interopDefault(require$$0$11);
module.exports = function(IS_INCLUDES){
  return function($this, el, fromIndex){
    var O      = toIObject($this)
      , length = toLength(O.length)
      , index  = toIndex(fromIndex, length)
      , value;
    // Array#includes uses SameValueZero equality algorithm
    if(IS_INCLUDES && el != el)while(length > index){
      value = O[index++];
      if(value != value)return true;
    // Array#toIndex ignores holes, Array#includes - not
    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
      if(O[index] === el)return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};
});

var _arrayIncludes$1 = interopDefault(_arrayIncludes);


var require$$1$8 = Object.freeze({
  default: _arrayIncludes$1
});

var require$$1$8 = Object.freeze({
  default: _arrayIncludes$1
});

var _shared = createCommonjsModule(function (module) {
var global = interopDefault(require$$4)
  , SHARED = '__core-js_shared__'
  , store  = global[SHARED] || (global[SHARED] = {});
module.exports = function(key){
  return store[key] || (store[key] = {});
};
});

var _shared$1 = interopDefault(_shared);


var require$$22 = Object.freeze({
  default: _shared$1
});

var require$$22 = Object.freeze({
  default: _shared$1
});

var _uid = createCommonjsModule(function (module) {
var id = 0
  , px = Math.random();
module.exports = function(key){
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};
});

var _uid$1 = interopDefault(_uid);


var require$$4$3 = Object.freeze({
  default: _uid$1
});

var require$$4$3 = Object.freeze({
  default: _uid$1
});

var _sharedKey = createCommonjsModule(function (module) {
var shared = interopDefault(require$$22)('keys')
  , uid    = interopDefault(require$$4$3);
module.exports = function(key){
  return shared[key] || (shared[key] = uid(key));
};
});

var _sharedKey$1 = interopDefault(_sharedKey);


var require$$0$12 = Object.freeze({
  default: _sharedKey$1
});

var require$$0$12 = Object.freeze({
  default: _sharedKey$1
});

var _objectKeysInternal = createCommonjsModule(function (module) {
var has          = interopDefault(require$$2$3)
  , toIObject    = interopDefault(require$$4$2)
  , arrayIndexOf = interopDefault(require$$1$8)(false)
  , IE_PROTO     = interopDefault(require$$0$12)('IE_PROTO');

module.exports = function(object, names){
  var O      = toIObject(object)
    , i      = 0
    , result = []
    , key;
  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while(names.length > i)if(has(O, key = names[i++])){
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};
});

var _objectKeysInternal$1 = interopDefault(_objectKeysInternal);


var require$$1$6 = Object.freeze({
  default: _objectKeysInternal$1
});

var require$$1$6 = Object.freeze({
  default: _objectKeysInternal$1
});

var _enumBugKeys = createCommonjsModule(function (module) {
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');
});

var _enumBugKeys$1 = interopDefault(_enumBugKeys);


var require$$0$13 = Object.freeze({
  default: _enumBugKeys$1
});

var require$$0$13 = Object.freeze({
  default: _enumBugKeys$1
});

var _objectKeys = createCommonjsModule(function (module) {
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys       = interopDefault(require$$1$6)
  , enumBugKeys = interopDefault(require$$0$13);

module.exports = Object.keys || function keys(O){
  return $keys(O, enumBugKeys);
};
});

var _objectKeys$1 = interopDefault(_objectKeys);


var require$$5$2 = Object.freeze({
  default: _objectKeys$1
});

var require$$5$2 = Object.freeze({
  default: _objectKeys$1
});

var _objectDps = createCommonjsModule(function (module) {
var dP       = interopDefault(require$$2)
  , anObject = interopDefault(require$$2$1)
  , getKeys  = interopDefault(require$$5$2);

module.exports = interopDefault(require$$1$3) ? Object.defineProperties : function defineProperties(O, Properties){
  anObject(O);
  var keys   = getKeys(Properties)
    , length = keys.length
    , i = 0
    , P;
  while(length > i)dP.f(O, P = keys[i++], Properties[P]);
  return O;
};
});

var _objectDps$1 = interopDefault(_objectDps);


var require$$4$1 = Object.freeze({
  default: _objectDps$1
});

var require$$4$1 = Object.freeze({
  default: _objectDps$1
});

var _html = createCommonjsModule(function (module) {
module.exports = interopDefault(require$$4).document && document.documentElement;
});

var _html$1 = interopDefault(_html);


var require$$3$3 = Object.freeze({
	default: _html$1
});

var require$$3$3 = Object.freeze({
	default: _html$1
});

var _objectCreate = createCommonjsModule(function (module) {
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject    = interopDefault(require$$2$1)
  , dPs         = interopDefault(require$$4$1)
  , enumBugKeys = interopDefault(require$$0$13)
  , IE_PROTO    = interopDefault(require$$0$12)('IE_PROTO')
  , Empty       = function(){ /* empty */ }
  , PROTOTYPE   = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function(){
  // Thrash, waste and sodomy: IE GC bug
  var iframe = interopDefault(require$$2$2)('iframe')
    , i      = enumBugKeys.length
    , gt     = '>'
    , iframeDocument;
  iframe.style.display = 'none';
  interopDefault(require$$3$3).appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write('<script>document.F=Object</script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while(i--)delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties){
  var result;
  if(O !== null){
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty;
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};
});

var _objectCreate$1 = interopDefault(_objectCreate);


var require$$9 = Object.freeze({
  default: _objectCreate$1
});

var require$$9 = Object.freeze({
  default: _objectCreate$1
});

var _wks = createCommonjsModule(function (module) {
var store      = interopDefault(require$$22)('wks')
  , uid        = interopDefault(require$$4$3)
  , Symbol     = interopDefault(require$$4).Symbol
  , USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function(name){
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;
});

var _wks$1 = interopDefault(_wks);


var require$$0$14 = Object.freeze({
  default: _wks$1
});

var require$$0$14 = Object.freeze({
  default: _wks$1
});

var _setToStringTag = createCommonjsModule(function (module) {
var def = interopDefault(require$$2).f
  , has = interopDefault(require$$2$3)
  , TAG = interopDefault(require$$0$14)('toStringTag');

module.exports = function(it, tag, stat){
  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
};
});

var _setToStringTag$1 = interopDefault(_setToStringTag);


var require$$3$4 = Object.freeze({
  default: _setToStringTag$1
});

var require$$3$4 = Object.freeze({
  default: _setToStringTag$1
});

var _iterCreate = createCommonjsModule(function (module) {
'use strict';
var create         = interopDefault(require$$9)
  , descriptor     = interopDefault(require$$5$1)
  , setToStringTag = interopDefault(require$$3$4)
  , IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
interopDefault(require$$0$3)(IteratorPrototype, interopDefault(require$$0$14)('iterator'), function(){ return this; });

module.exports = function(Constructor, NAME, next){
  Constructor.prototype = create(IteratorPrototype, {next: descriptor(1, next)});
  setToStringTag(Constructor, NAME + ' Iterator');
};
});

var _iterCreate$1 = interopDefault(_iterCreate);


var require$$3$2 = Object.freeze({
  default: _iterCreate$1
});

var require$$3$2 = Object.freeze({
  default: _iterCreate$1
});

var _toObject = createCommonjsModule(function (module) {
// 7.1.13 ToObject(argument)
var defined = interopDefault(require$$0$8);
module.exports = function(it){
  return Object(defined(it));
};
});

var _toObject$1 = interopDefault(_toObject);


var require$$2$4 = Object.freeze({
  default: _toObject$1
});

var require$$2$4 = Object.freeze({
  default: _toObject$1
});

var _objectGpo = createCommonjsModule(function (module) {
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has         = interopDefault(require$$2$3)
  , toObject    = interopDefault(require$$2$4)
  , IE_PROTO    = interopDefault(require$$0$12)('IE_PROTO')
  , ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function(O){
  O = toObject(O);
  if(has(O, IE_PROTO))return O[IE_PROTO];
  if(typeof O.constructor == 'function' && O instanceof O.constructor){
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};
});

var _objectGpo$1 = interopDefault(_objectGpo);


var require$$1$10 = Object.freeze({
  default: _objectGpo$1
});

var require$$1$10 = Object.freeze({
  default: _objectGpo$1
});

var _iterDefine = createCommonjsModule(function (module) {
'use strict';
var LIBRARY        = interopDefault(require$$19)
  , $export        = interopDefault(require$$1)
  , redefine       = interopDefault(require$$25)
  , hide           = interopDefault(require$$0$3)
  , has            = interopDefault(require$$2$3)
  , Iterators      = interopDefault(require$$1$5)
  , $iterCreate    = interopDefault(require$$3$2)
  , setToStringTag = interopDefault(require$$3$4)
  , getPrototypeOf = interopDefault(require$$1$10)
  , ITERATOR       = interopDefault(require$$0$14)('iterator')
  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  , FF_ITERATOR    = '@@iterator'
  , KEYS           = 'keys'
  , VALUES         = 'values';

var returnThis = function(){ return this; };

module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
  $iterCreate(Constructor, NAME, next);
  var getMethod = function(kind){
    if(!BUGGY && kind in proto)return proto[kind];
    switch(kind){
      case KEYS: return function keys(){ return new Constructor(this, kind); };
      case VALUES: return function values(){ return new Constructor(this, kind); };
    } return function entries(){ return new Constructor(this, kind); };
  };
  var TAG        = NAME + ' Iterator'
    , DEF_VALUES = DEFAULT == VALUES
    , VALUES_BUG = false
    , proto      = Base.prototype
    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
    , $default   = $native || getMethod(DEFAULT)
    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
    , methods, key, IteratorPrototype;
  // Fix native
  if($anyNative){
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base));
    if(IteratorPrototype !== Object.prototype){
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if(!LIBRARY && !has(IteratorPrototype, ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if(DEF_VALUES && $native && $native.name !== VALUES){
    VALUES_BUG = true;
    $default = function values(){ return $native.call(this); };
  }
  // Define iterator
  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG]  = returnThis;
  if(DEFAULT){
    methods = {
      values:  DEF_VALUES ? $default : getMethod(VALUES),
      keys:    IS_SET     ? $default : getMethod(KEYS),
      entries: $entries
    };
    if(FORCED)for(key in methods){
      if(!(key in proto))redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};
});

var _iterDefine$1 = interopDefault(_iterDefine);


var require$$0$9 = Object.freeze({
  default: _iterDefine$1
});

var require$$0$9 = Object.freeze({
  default: _iterDefine$1
});

var es6_string_iterator = createCommonjsModule(function (module) {
'use strict';
var $at  = interopDefault(require$$1$4)(true);

// 21.1.3.27 String.prototype[@@iterator]()
interopDefault(require$$0$9)(String, 'String', function(iterated){
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , index = this._i
    , point;
  if(index >= O.length)return {value: undefined, done: true};
  point = $at(O, index);
  this._i += point.length;
  return {value: point, done: false};
});
});

interopDefault(es6_string_iterator);

var _iterCall = createCommonjsModule(function (module) {
// call something on iterator step with safe closing on error
var anObject = interopDefault(require$$2$1);
module.exports = function(iterator, fn, value, entries){
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch(e){
    var ret = iterator['return'];
    if(ret !== undefined)anObject(ret.call(iterator));
    throw e;
  }
};
});

var _iterCall$1 = interopDefault(_iterCall);


var require$$4$4 = Object.freeze({
  default: _iterCall$1
});

var require$$4$4 = Object.freeze({
  default: _iterCall$1
});

var _isArrayIter = createCommonjsModule(function (module) {
// check on default Array iterator
var Iterators  = interopDefault(require$$1$5)
  , ITERATOR   = interopDefault(require$$0$14)('iterator')
  , ArrayProto = Array.prototype;

module.exports = function(it){
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};
});

var _isArrayIter$1 = interopDefault(_isArrayIter);


var require$$3$5 = Object.freeze({
  default: _isArrayIter$1
});

var require$$3$5 = Object.freeze({
  default: _isArrayIter$1
});

var _createProperty = createCommonjsModule(function (module) {
'use strict';
var $defineProperty = interopDefault(require$$2)
  , createDesc      = interopDefault(require$$5$1);

module.exports = function(object, index, value){
  if(index in object)$defineProperty.f(object, index, createDesc(0, value));
  else object[index] = value;
};
});

var _createProperty$1 = interopDefault(_createProperty);


var require$$2$5 = Object.freeze({
  default: _createProperty$1
});

var require$$2$5 = Object.freeze({
  default: _createProperty$1
});

var _classof = createCommonjsModule(function (module) {
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = interopDefault(require$$0$10)
  , TAG = interopDefault(require$$0$14)('toStringTag')
  // ES3 wrong here
  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function(it, key){
  try {
    return it[key];
  } catch(e){ /* empty */ }
};

module.exports = function(it){
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};
});

var _classof$1 = interopDefault(_classof);


var require$$16 = Object.freeze({
  default: _classof$1
});

var require$$16 = Object.freeze({
  default: _classof$1
});

var core_getIteratorMethod = createCommonjsModule(function (module) {
var classof   = interopDefault(require$$16)
  , ITERATOR  = interopDefault(require$$0$14)('iterator')
  , Iterators = interopDefault(require$$1$5);
module.exports = interopDefault(require$$0$2).getIteratorMethod = function(it){
  if(it != undefined)return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};
});

var core_getIteratorMethod$1 = interopDefault(core_getIteratorMethod);


var require$$0$15 = Object.freeze({
  default: core_getIteratorMethod$1
});

var require$$0$15 = Object.freeze({
  default: core_getIteratorMethod$1
});

var _iterDetect = createCommonjsModule(function (module) {
var ITERATOR     = interopDefault(require$$0$14)('iterator')
  , SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function(){ SAFE_CLOSING = true; };
  Array.from(riter, function(){ throw 2; });
} catch(e){ /* empty */ }

module.exports = function(exec, skipClosing){
  if(!skipClosing && !SAFE_CLOSING)return false;
  var safe = false;
  try {
    var arr  = [7]
      , iter = arr[ITERATOR]();
    iter.next = function(){ return {done: safe = true}; };
    arr[ITERATOR] = function(){ return iter; };
    exec(arr);
  } catch(e){ /* empty */ }
  return safe;
};
});

var _iterDetect$1 = interopDefault(_iterDetect);


var require$$0$16 = Object.freeze({
  default: _iterDetect$1
});

var require$$0$16 = Object.freeze({
  default: _iterDetect$1
});

var es6_array_from = createCommonjsModule(function (module) {
'use strict';
var ctx            = interopDefault(require$$5)
  , $export        = interopDefault(require$$1)
  , toObject       = interopDefault(require$$2$4)
  , call           = interopDefault(require$$4$4)
  , isArrayIter    = interopDefault(require$$3$5)
  , toLength       = interopDefault(require$$1$9)
  , createProperty = interopDefault(require$$2$5)
  , getIterFn      = interopDefault(require$$0$15);

$export($export.S + $export.F * !interopDefault(require$$0$16)(function(iter){ Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
    var O       = toObject(arrayLike)
      , C       = typeof this == 'function' ? this : Array
      , aLen    = arguments.length
      , mapfn   = aLen > 1 ? arguments[1] : undefined
      , mapping = mapfn !== undefined
      , index   = 0
      , iterFn  = getIterFn(O)
      , length, result, step, iterator;
    if(mapping)mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = toLength(O.length);
      for(result = new C(length); length > index; index++){
        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});
});

interopDefault(es6_array_from);

var from$2 = createCommonjsModule(function (module) {
module.exports = interopDefault(require$$0$2).Array.from;
});

var from$3 = interopDefault(from$2);


var require$$0$6 = Object.freeze({
	default: from$3
});

var require$$0$6 = Object.freeze({
	default: from$3
});

var from = createCommonjsModule(function (module) {
module.exports = { "default": interopDefault(require$$0$6), __esModule: true };
});

var from$1 = interopDefault(from);


var require$$0$5 = Object.freeze({
	default: from$1
});

var require$$0$5 = Object.freeze({
	default: from$1
});

var toConsumableArray = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

var _from = interopDefault(require$$0$5);

var _from2 = _interopRequireDefault(_from);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  } else {
    return (0, _from2.default)(arr);
  }
};
});

var _toConsumableArray = interopDefault(toConsumableArray);

var _addToUnscopables = createCommonjsModule(function (module) {
module.exports = function(){ /* empty */ };
});

var _addToUnscopables$1 = interopDefault(_addToUnscopables);


var require$$4$5 = Object.freeze({
	default: _addToUnscopables$1
});

var require$$4$5 = Object.freeze({
	default: _addToUnscopables$1
});

var _iterStep = createCommonjsModule(function (module) {
module.exports = function(done, value){
  return {value: value, done: !!done};
};
});

var _iterStep$1 = interopDefault(_iterStep);


var require$$3$6 = Object.freeze({
  default: _iterStep$1
});

var require$$3$6 = Object.freeze({
  default: _iterStep$1
});

var es6_array_iterator = createCommonjsModule(function (module) {
'use strict';
var addToUnscopables = interopDefault(require$$4$5)
  , step             = interopDefault(require$$3$6)
  , Iterators        = interopDefault(require$$1$5)
  , toIObject        = interopDefault(require$$4$2);

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = interopDefault(require$$0$9)(Array, 'Array', function(iterated, kind){
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function(){
  var O     = this._t
    , kind  = this._k
    , index = this._i++;
  if(!O || index >= O.length){
    this._t = undefined;
    return step(1);
  }
  if(kind == 'keys'  )return step(0, index);
  if(kind == 'values')return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');
});

interopDefault(es6_array_iterator);

var web_dom_iterable = createCommonjsModule(function (module) {
var global        = interopDefault(require$$4)
  , hide          = interopDefault(require$$0$3)
  , Iterators     = interopDefault(require$$1$5)
  , TO_STRING_TAG = interopDefault(require$$0$14)('toStringTag');

for(var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++){
  var NAME       = collections[i]
    , Collection = global[NAME]
    , proto      = Collection && Collection.prototype;
  if(proto && !proto[TO_STRING_TAG])hide(proto, TO_STRING_TAG, NAME);
  Iterators[NAME] = Iterators.Array;
}
});

interopDefault(web_dom_iterable);

var core_isIterable = createCommonjsModule(function (module) {
var classof   = interopDefault(require$$16)
  , ITERATOR  = interopDefault(require$$0$14)('iterator')
  , Iterators = interopDefault(require$$1$5);
module.exports = interopDefault(require$$0$2).isIterable = function(it){
  var O = Object(it);
  return O[ITERATOR] !== undefined
    || '@@iterator' in O
    || Iterators.hasOwnProperty(classof(O));
};
});

var core_isIterable$1 = interopDefault(core_isIterable);


var require$$0$18 = Object.freeze({
  default: core_isIterable$1
});

var require$$0$18 = Object.freeze({
  default: core_isIterable$1
});

var isIterable$2 = createCommonjsModule(function (module) {
module.exports = interopDefault(require$$0$18);
});

var isIterable$3 = interopDefault(isIterable$2);


var require$$0$17 = Object.freeze({
	default: isIterable$3
});

var require$$0$17 = Object.freeze({
	default: isIterable$3
});

var isIterable = createCommonjsModule(function (module) {
module.exports = { "default": interopDefault(require$$0$17), __esModule: true };
});

var isIterable$1 = interopDefault(isIterable);


var require$$1$11 = Object.freeze({
	default: isIterable$1
});

var require$$1$11 = Object.freeze({
	default: isIterable$1
});

var core_getIterator = createCommonjsModule(function (module) {
var anObject = interopDefault(require$$2$1)
  , get      = interopDefault(require$$0$15);
module.exports = interopDefault(require$$0$2).getIterator = function(it){
  var iterFn = get(it);
  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
  return anObject(iterFn.call(it));
};
});

var core_getIterator$1 = interopDefault(core_getIterator);


var require$$0$21 = Object.freeze({
  default: core_getIterator$1
});

var require$$0$21 = Object.freeze({
  default: core_getIterator$1
});

var getIterator$2 = createCommonjsModule(function (module) {
module.exports = interopDefault(require$$0$21);
});

var getIterator$3 = interopDefault(getIterator$2);


var require$$0$20 = Object.freeze({
	default: getIterator$3
});

var require$$0$20 = Object.freeze({
	default: getIterator$3
});

var getIterator = createCommonjsModule(function (module) {
module.exports = { "default": interopDefault(require$$0$20), __esModule: true };
});

var getIterator$1 = interopDefault(getIterator);


var require$$0$19 = Object.freeze({
	default: getIterator$1
});

var require$$0$19 = Object.freeze({
	default: getIterator$1
});

var slicedToArray = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

var _isIterable2 = interopDefault(require$$1$11);

var _isIterable3 = _interopRequireDefault(_isIterable2);

var _getIterator2 = interopDefault(require$$0$19);

var _getIterator3 = _interopRequireDefault(_getIterator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = (0, _getIterator3.default)(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if ((0, _isIterable3.default)(Object(arr))) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();
});

var _slicedToArray = interopDefault(slicedToArray);

var _wksExt = createCommonjsModule(function (module, exports) {
exports.f = interopDefault(require$$0$14);
});

var _wksExt$1 = interopDefault(_wksExt);
var f$1 = _wksExt.f;

var require$$1$13 = Object.freeze({
	default: _wksExt$1,
	f: f$1
});

var require$$1$13 = Object.freeze({
	default: _wksExt$1,
	f: f$1
});

var iterator$2 = createCommonjsModule(function (module) {
module.exports = interopDefault(require$$1$13).f('iterator');
});

var iterator$3 = interopDefault(iterator$2);


var require$$0$22 = Object.freeze({
	default: iterator$3
});

var require$$0$22 = Object.freeze({
	default: iterator$3
});

var iterator = createCommonjsModule(function (module) {
module.exports = { "default": interopDefault(require$$0$22), __esModule: true };
});

var iterator$1 = interopDefault(iterator);


var require$$1$12 = Object.freeze({
	default: iterator$1
});

var require$$1$12 = Object.freeze({
	default: iterator$1
});

var _meta = createCommonjsModule(function (module) {
var META     = interopDefault(require$$4$3)('meta')
  , isObject = interopDefault(require$$3)
  , has      = interopDefault(require$$2$3)
  , setDesc  = interopDefault(require$$2).f
  , id       = 0;
var isExtensible = Object.isExtensible || function(){
  return true;
};
var FREEZE = !interopDefault(require$$0$4)(function(){
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function(it){
  setDesc(it, META, {value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  }});
};
var fastKey = function(it, create){
  // return primitive with prefix
  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if(!has(it, META)){
    // can't set metadata to uncaught frozen object
    if(!isExtensible(it))return 'F';
    // not necessary to add metadata
    if(!create)return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function(it, create){
  if(!has(it, META)){
    // can't set metadata to uncaught frozen object
    if(!isExtensible(it))return true;
    // not necessary to add metadata
    if(!create)return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function(it){
  if(FREEZE && meta.NEED && isExtensible(it) && !has(it, META))setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY:      META,
  NEED:     false,
  fastKey:  fastKey,
  getWeak:  getWeak,
  onFreeze: onFreeze
};
});

var _meta$1 = interopDefault(_meta);
var KEY = _meta.KEY;
var NEED = _meta.NEED;
var fastKey = _meta.fastKey;
var getWeak = _meta.getWeak;
var onFreeze = _meta.onFreeze;

var require$$24 = Object.freeze({
  default: _meta$1,
  KEY: KEY,
  NEED: NEED,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
});

var require$$24 = Object.freeze({
  default: _meta$1,
  KEY: KEY,
  NEED: NEED,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
});

var _wksDefine = createCommonjsModule(function (module) {
var global         = interopDefault(require$$4)
  , core           = interopDefault(require$$0$2)
  , LIBRARY        = interopDefault(require$$19)
  , wksExt         = interopDefault(require$$1$13)
  , defineProperty = interopDefault(require$$2).f;
module.exports = function(name){
  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
  if(name.charAt(0) != '_' && !(name in $Symbol))defineProperty($Symbol, name, {value: wksExt.f(name)});
};
});

var _wksDefine$1 = interopDefault(_wksDefine);


var require$$0$25 = Object.freeze({
  default: _wksDefine$1
});

var require$$0$25 = Object.freeze({
  default: _wksDefine$1
});

var _keyof = createCommonjsModule(function (module) {
var getKeys   = interopDefault(require$$5$2)
  , toIObject = interopDefault(require$$4$2);
module.exports = function(object, el){
  var O      = toIObject(object)
    , keys   = getKeys(O)
    , length = keys.length
    , index  = 0
    , key;
  while(length > index)if(O[key = keys[index++]] === el)return key;
};
});

var _keyof$1 = interopDefault(_keyof);


var require$$16$1 = Object.freeze({
  default: _keyof$1
});

var require$$16$1 = Object.freeze({
  default: _keyof$1
});

var _objectGops = createCommonjsModule(function (module, exports) {
exports.f = Object.getOwnPropertySymbols;
});

var _objectGops$1 = interopDefault(_objectGops);
var f$2 = _objectGops.f;

var require$$4$6 = Object.freeze({
	default: _objectGops$1,
	f: f$2
});

var require$$4$6 = Object.freeze({
	default: _objectGops$1,
	f: f$2
});

var _objectPie = createCommonjsModule(function (module, exports) {
exports.f = {}.propertyIsEnumerable;
});

var _objectPie$1 = interopDefault(_objectPie);
var f$3 = _objectPie.f;

var require$$3$7 = Object.freeze({
	default: _objectPie$1,
	f: f$3
});

var require$$3$7 = Object.freeze({
	default: _objectPie$1,
	f: f$3
});

var _enumKeys = createCommonjsModule(function (module) {
// all enumerable object keys, includes symbols
var getKeys = interopDefault(require$$5$2)
  , gOPS    = interopDefault(require$$4$6)
  , pIE     = interopDefault(require$$3$7);
module.exports = function(it){
  var result     = getKeys(it)
    , getSymbols = gOPS.f;
  if(getSymbols){
    var symbols = getSymbols(it)
      , isEnum  = pIE.f
      , i       = 0
      , key;
    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))result.push(key);
  } return result;
};
});

var _enumKeys$1 = interopDefault(_enumKeys);


var require$$15 = Object.freeze({
  default: _enumKeys$1
});

var require$$15 = Object.freeze({
  default: _enumKeys$1
});

var _isArray = createCommonjsModule(function (module) {
// 7.2.2 IsArray(argument)
var cof = interopDefault(require$$0$10);
module.exports = Array.isArray || function isArray(arg){
  return cof(arg) == 'Array';
};
});

var _isArray$1 = interopDefault(_isArray);


var require$$14 = Object.freeze({
  default: _isArray$1
});

var require$$14 = Object.freeze({
  default: _isArray$1
});

var _objectGopn = createCommonjsModule(function (module, exports) {
// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
var $keys      = interopDefault(require$$1$6)
  , hiddenKeys = interopDefault(require$$0$13).concat('length', 'prototype');

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O){
  return $keys(O, hiddenKeys);
};
});

var _objectGopn$1 = interopDefault(_objectGopn);
var f$5 = _objectGopn.f;

var require$$0$26 = Object.freeze({
  default: _objectGopn$1,
  f: f$5
});

var require$$0$26 = Object.freeze({
  default: _objectGopn$1,
  f: f$5
});

var _objectGopnExt = createCommonjsModule(function (module) {
// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
var toIObject = interopDefault(require$$4$2)
  , gOPN      = interopDefault(require$$0$26).f
  , toString  = {}.toString;

var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
  ? Object.getOwnPropertyNames(window) : [];

var getWindowNames = function(it){
  try {
    return gOPN(it);
  } catch(e){
    return windowNames.slice();
  }
};

module.exports.f = function getOwnPropertyNames(it){
  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
};
});

var _objectGopnExt$1 = interopDefault(_objectGopnExt);
var f$4 = _objectGopnExt.f;

var require$$8 = Object.freeze({
  default: _objectGopnExt$1,
  f: f$4
});

var require$$8 = Object.freeze({
  default: _objectGopnExt$1,
  f: f$4
});

var _objectGopd = createCommonjsModule(function (module, exports) {
var pIE            = interopDefault(require$$3$7)
  , createDesc     = interopDefault(require$$5$1)
  , toIObject      = interopDefault(require$$4$2)
  , toPrimitive    = interopDefault(require$$3$1)
  , has            = interopDefault(require$$2$3)
  , IE8_DOM_DEFINE = interopDefault(require$$1$2)
  , gOPD           = Object.getOwnPropertyDescriptor;

exports.f = interopDefault(require$$1$3) ? gOPD : function getOwnPropertyDescriptor(O, P){
  O = toIObject(O);
  P = toPrimitive(P, true);
  if(IE8_DOM_DEFINE)try {
    return gOPD(O, P);
  } catch(e){ /* empty */ }
  if(has(O, P))return createDesc(!pIE.f.call(O, P), O[P]);
};
});

var _objectGopd$1 = interopDefault(_objectGopd);
var f$6 = _objectGopd.f;

var require$$0$27 = Object.freeze({
  default: _objectGopd$1,
  f: f$6
});

var require$$0$27 = Object.freeze({
  default: _objectGopd$1,
  f: f$6
});

var es6_symbol = createCommonjsModule(function (module) {
'use strict';
// ECMAScript 6 symbols shim
var global         = interopDefault(require$$4)
  , has            = interopDefault(require$$2$3)
  , DESCRIPTORS    = interopDefault(require$$1$3)
  , $export        = interopDefault(require$$1)
  , redefine       = interopDefault(require$$25)
  , META           = interopDefault(require$$24).KEY
  , $fails         = interopDefault(require$$0$4)
  , shared         = interopDefault(require$$22)
  , setToStringTag = interopDefault(require$$3$4)
  , uid            = interopDefault(require$$4$3)
  , wks            = interopDefault(require$$0$14)
  , wksExt         = interopDefault(require$$1$13)
  , wksDefine      = interopDefault(require$$0$25)
  , keyOf          = interopDefault(require$$16$1)
  , enumKeys       = interopDefault(require$$15)
  , isArray        = interopDefault(require$$14)
  , anObject       = interopDefault(require$$2$1)
  , toIObject      = interopDefault(require$$4$2)
  , toPrimitive    = interopDefault(require$$3$1)
  , createDesc     = interopDefault(require$$5$1)
  , _create        = interopDefault(require$$9)
  , gOPNExt        = interopDefault(require$$8)
  , $GOPD          = interopDefault(require$$0$27)
  , $DP            = interopDefault(require$$2)
  , $keys          = interopDefault(require$$5$2)
  , gOPD           = $GOPD.f
  , dP             = $DP.f
  , gOPN           = gOPNExt.f
  , $Symbol        = global.Symbol
  , $JSON          = global.JSON
  , _stringify     = $JSON && $JSON.stringify
  , PROTOTYPE      = 'prototype'
  , HIDDEN         = wks('_hidden')
  , TO_PRIMITIVE   = wks('toPrimitive')
  , isEnum         = {}.propertyIsEnumerable
  , SymbolRegistry = shared('symbol-registry')
  , AllSymbols     = shared('symbols')
  , OPSymbols      = shared('op-symbols')
  , ObjectProto    = Object[PROTOTYPE]
  , USE_NATIVE     = typeof $Symbol == 'function'
  , QObject        = global.QObject;
// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
var setSymbolDesc = DESCRIPTORS && $fails(function(){
  return _create(dP({}, 'a', {
    get: function(){ return dP(this, 'a', {value: 7}).a; }
  })).a != 7;
}) ? function(it, key, D){
  var protoDesc = gOPD(ObjectProto, key);
  if(protoDesc)delete ObjectProto[key];
  dP(it, key, D);
  if(protoDesc && it !== ObjectProto)dP(ObjectProto, key, protoDesc);
} : dP;

var wrap = function(tag){
  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
  sym._k = tag;
  return sym;
};

var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function(it){
  return typeof it == 'symbol';
} : function(it){
  return it instanceof $Symbol;
};

var $defineProperty = function defineProperty(it, key, D){
  if(it === ObjectProto)$defineProperty(OPSymbols, key, D);
  anObject(it);
  key = toPrimitive(key, true);
  anObject(D);
  if(has(AllSymbols, key)){
    if(!D.enumerable){
      if(!has(it, HIDDEN))dP(it, HIDDEN, createDesc(1, {}));
      it[HIDDEN][key] = true;
    } else {
      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
      D = _create(D, {enumerable: createDesc(0, false)});
    } return setSymbolDesc(it, key, D);
  } return dP(it, key, D);
};
var $defineProperties = function defineProperties(it, P){
  anObject(it);
  var keys = enumKeys(P = toIObject(P))
    , i    = 0
    , l = keys.length
    , key;
  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
  return it;
};
var $create = function create(it, P){
  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
};
var $propertyIsEnumerable = function propertyIsEnumerable(key){
  var E = isEnum.call(this, key = toPrimitive(key, true));
  if(this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key))return false;
  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
};
var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
  it  = toIObject(it);
  key = toPrimitive(key, true);
  if(it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key))return;
  var D = gOPD(it, key);
  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
  return D;
};
var $getOwnPropertyNames = function getOwnPropertyNames(it){
  var names  = gOPN(toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i){
    if(!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META)result.push(key);
  } return result;
};
var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
  var IS_OP  = it === ObjectProto
    , names  = gOPN(IS_OP ? OPSymbols : toIObject(it))
    , result = []
    , i      = 0
    , key;
  while(names.length > i){
    if(has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true))result.push(AllSymbols[key]);
  } return result;
};

// 19.4.1.1 Symbol([description])
if(!USE_NATIVE){
  $Symbol = function Symbol(){
    if(this instanceof $Symbol)throw TypeError('Symbol is not a constructor!');
    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
    var $set = function(value){
      if(this === ObjectProto)$set.call(OPSymbols, value);
      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
      setSymbolDesc(this, tag, createDesc(1, value));
    };
    if(DESCRIPTORS && setter)setSymbolDesc(ObjectProto, tag, {configurable: true, set: $set});
    return wrap(tag);
  };
  redefine($Symbol[PROTOTYPE], 'toString', function toString(){
    return this._k;
  });

  $GOPD.f = $getOwnPropertyDescriptor;
  $DP.f   = $defineProperty;
  interopDefault(require$$0$26).f = gOPNExt.f = $getOwnPropertyNames;
  interopDefault(require$$3$7).f  = $propertyIsEnumerable;
  interopDefault(require$$4$6).f = $getOwnPropertySymbols;

  if(DESCRIPTORS && !interopDefault(require$$19)){
    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
  }

  wksExt.f = function(name){
    return wrap(wks(name));
  }
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, {Symbol: $Symbol});

for(var symbols = (
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
).split(','), i = 0; symbols.length > i; )wks(symbols[i++]);

for(var symbols = $keys(wks.store), i = 0; symbols.length > i; )wksDefine(symbols[i++]);

$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
  // 19.4.2.1 Symbol.for(key)
  'for': function(key){
    return has(SymbolRegistry, key += '')
      ? SymbolRegistry[key]
      : SymbolRegistry[key] = $Symbol(key);
  },
  // 19.4.2.5 Symbol.keyFor(sym)
  keyFor: function keyFor(key){
    if(isSymbol(key))return keyOf(SymbolRegistry, key);
    throw TypeError(key + ' is not a symbol!');
  },
  useSetter: function(){ setter = true; },
  useSimple: function(){ setter = false; }
});

$export($export.S + $export.F * !USE_NATIVE, 'Object', {
  // 19.1.2.2 Object.create(O [, Properties])
  create: $create,
  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
  defineProperty: $defineProperty,
  // 19.1.2.3 Object.defineProperties(O, Properties)
  defineProperties: $defineProperties,
  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
  // 19.1.2.7 Object.getOwnPropertyNames(O)
  getOwnPropertyNames: $getOwnPropertyNames,
  // 19.1.2.8 Object.getOwnPropertySymbols(O)
  getOwnPropertySymbols: $getOwnPropertySymbols
});

// 24.3.2 JSON.stringify(value [, replacer [, space]])
$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function(){
  var S = $Symbol();
  // MS Edge converts symbol values to JSON as {}
  // WebKit converts symbol values to JSON as null
  // V8 throws on boxed symbols
  return _stringify([S]) != '[null]' || _stringify({a: S}) != '{}' || _stringify(Object(S)) != '{}';
})), 'JSON', {
  stringify: function stringify(it){
    if(it === undefined || isSymbol(it))return; // IE8 returns string on undefined
    var args = [it]
      , i    = 1
      , replacer, $replacer;
    while(arguments.length > i)args.push(arguments[i++]);
    replacer = args[1];
    if(typeof replacer == 'function')$replacer = replacer;
    if($replacer || !isArray(replacer))replacer = function(key, value){
      if($replacer)value = $replacer.call(this, key, value);
      if(!isSymbol(value))return value;
    };
    args[1] = replacer;
    return _stringify.apply($JSON, args);
  }
});

// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
$Symbol[PROTOTYPE][TO_PRIMITIVE] || interopDefault(require$$0$3)($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
// 19.4.3.5 Symbol.prototype[@@toStringTag]
setToStringTag($Symbol, 'Symbol');
// 20.2.1.9 Math[@@toStringTag]
setToStringTag(Math, 'Math', true);
// 24.3.3 JSON[@@toStringTag]
setToStringTag(global.JSON, 'JSON', true);
});

interopDefault(es6_symbol);

var es7_symbol_asyncIterator = createCommonjsModule(function (module) {
interopDefault(require$$0$25)('asyncIterator');
});

interopDefault(es7_symbol_asyncIterator);

var es7_symbol_observable = createCommonjsModule(function (module) {
interopDefault(require$$0$25)('observable');
});

interopDefault(es7_symbol_observable);

var index = createCommonjsModule(function (module) {
module.exports = interopDefault(require$$0$2).Symbol;
});

var index$1 = interopDefault(index);


var require$$0$24 = Object.freeze({
	default: index$1
});

var require$$0$24 = Object.freeze({
	default: index$1
});

var symbol = createCommonjsModule(function (module) {
module.exports = { "default": interopDefault(require$$0$24), __esModule: true };
});

var symbol$1 = interopDefault(symbol);


var require$$0$23 = Object.freeze({
	default: symbol$1
});

var require$$0$23 = Object.freeze({
	default: symbol$1
});

var _typeof = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

var _iterator = interopDefault(require$$1$12);

var _iterator2 = _interopRequireDefault(_iterator);

var _symbol = interopDefault(require$$0$23);

var _symbol2 = _interopRequireDefault(_symbol);

var _typeof = typeof _symbol2.default === "function" && typeof _iterator2.default === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default ? "symbol" : typeof obj; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = typeof _symbol2.default === "function" && _typeof(_iterator2.default) === "symbol" ? function (obj) {
  return typeof obj === "undefined" ? "undefined" : _typeof(obj);
} : function (obj) {
  return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof(obj);
};
});

var _typeof$1 = interopDefault(_typeof);

var runtime = createCommonjsModule(function (module) {
/**
 * Copyright (c) 2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
 * additional grant of patent rights can be found in the PATENTS file in
 * the same directory.
 */

!(function(global) {
  "use strict";

  var hasOwn = Object.prototype.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  var inModule = typeof module === "object";
  var runtime = global.regeneratorRuntime;
  if (runtime) {
    if (inModule) {
      // If regeneratorRuntime is defined globally and we're in a module,
      // make the exports object identical to regeneratorRuntime.
      module.exports = runtime;
    }
    // Don't bother evaluating the rest of this file if the runtime was
    // already defined globally.
    return;
  }

  // Define the runtime globally (as expected by generated code) as either
  // module.exports (if we're in a module) or a new, empty object.
  runtime = global.regeneratorRuntime = inModule ? module.exports : {};

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided, then outerFn.prototype instanceof Generator.
    var generator = Object.create((outerFn || Generator).prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  runtime.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction";

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      prototype[method] = function(arg) {
        return this._invoke(method, arg);
      };
    });
  }

  runtime.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  runtime.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      if (!(toStringTagSymbol in genFun)) {
        genFun[toStringTagSymbol] = "GeneratorFunction";
      }
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `value instanceof AwaitArgument` to determine if the yielded value is
  // meant to be awaited. Some may consider the name of this method too
  // cutesy, but they are curmudgeons.
  runtime.awrap = function(arg) {
    return new AwaitArgument(arg);
  };

  function AwaitArgument(arg) {
    this.arg = arg;
  }

  function AsyncIterator(generator) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value instanceof AwaitArgument) {
          return Promise.resolve(value.arg).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return Promise.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration. If the Promise is rejected, however, the
          // result for this iteration will be rejected with the same
          // reason. Note that rejections of yielded Promises are not
          // thrown back into the generator function, as is the case
          // when an awaited Promise is rejected. This difference in
          // behavior between yield and await is important, because it
          // allows the consumer to decide what to do with the yielded
          // rejection (swallow it and continue, manually .throw it back
          // into the generator, abandon iteration, whatever). With
          // await, by contrast, there is no opportunity to examine the
          // rejection reason outside the generator function, so the
          // only option is to throw it from the await expression, and
          // let the generator function handle the exception.
          result.value = unwrapped;
          resolve(result);
        }, reject);
      }
    }

    if (typeof process === "object" && process.domain) {
      invoke = process.domain.bind(invoke);
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new Promise(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList)
    );

    return runtime.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          if (method === "return" ||
              (method === "throw" && delegate.iterator[method] === undefined)) {
            // A return or throw (when the delegate iterator has no throw
            // method) always terminates the yield* loop.
            context.delegate = null;

            // If the delegate iterator has a return method, give it a
            // chance to clean up.
            var returnMethod = delegate.iterator["return"];
            if (returnMethod) {
              var record = tryCatch(returnMethod, delegate.iterator, arg);
              if (record.type === "throw") {
                // If the return method threw an exception, let that
                // exception prevail over the original return or throw.
                method = "throw";
                arg = record.arg;
                continue;
              }
            }

            if (method === "return") {
              // Continue with the outer return, now that the delegate
              // iterator has been terminated.
              continue;
            }
          }

          var record = tryCatch(
            delegate.iterator[method],
            delegate.iterator,
            arg
          );

          if (record.type === "throw") {
            context.delegate = null;

            // Like returning generator.throw(uncaught), but without the
            // overhead of an extra function call.
            method = "throw";
            arg = record.arg;
            continue;
          }

          // Delegate generator ran and handled its own exceptions so
          // regardless of what the method was, we continue as if it is
          // "next" with an undefined arg.
          method = "next";
          arg = undefined;

          var info = record.arg;
          if (info.done) {
            context[delegate.resultName] = info.value;
            context.next = delegate.nextLoc;
          } else {
            state = GenStateSuspendedYield;
            return info;
          }

          context.delegate = null;
        }

        if (method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = arg;

        } else if (method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw arg;
          }

          if (context.dispatchException(arg)) {
            // If the dispatched exception was caught by a catch block,
            // then let that catch block handle the exception normally.
            method = "next";
            arg = undefined;
          }

        } else if (method === "return") {
          context.abrupt("return", arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          var info = {
            value: record.arg,
            done: context.done
          };

          if (record.arg === ContinueSentinel) {
            if (context.delegate && method === "next") {
              // Deliberately forget the last sent value so that we don't
              // accidentally pass it on to the delegate.
              arg = undefined;
            }
          } else {
            return info;
          }

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(arg) call above.
          method = "throw";
          arg = record.arg;
        }
      }
    };
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp[toStringTagSymbol] = "Generator";

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  runtime.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  runtime.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;
        return !!caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.next = finallyEntry.finallyLoc;
      } else {
        this.complete(record);
      }

      return ContinueSentinel;
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = record.arg;
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      return ContinueSentinel;
    }
  };
})(
  // Among the various tricks for obtaining a reference to the global
  // object, this seems to be the most reliable technique that does not
  // use indirect eval (which violates Content Security Policy).
  typeof commonjsGlobal === "object" ? commonjsGlobal :
  typeof window === "object" ? window :
  typeof self === "object" ? self : commonjsGlobal
);
});

var runtime$1 = interopDefault(runtime);


var require$$0$29 = Object.freeze({
  default: runtime$1
});

var require$$0$29 = Object.freeze({
  default: runtime$1
});

var runtimeModule = createCommonjsModule(function (module) {
// This method of obtaining a reference to the global object needs to be
// kept identical to the way it is obtained in runtime.js
var g =
  typeof commonjsGlobal === "object" ? commonjsGlobal :
  typeof window === "object" ? window :
  typeof self === "object" ? self : commonjsGlobal;

// Use `getOwnPropertyNames` because not all browsers support calling
// `hasOwnProperty` on the global `self` object in a worker. See #183.
var hadRuntime = g.regeneratorRuntime &&
  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;

// Save the old regeneratorRuntime in case it needs to be restored later.
var oldRuntime = hadRuntime && g.regeneratorRuntime;

// Force reevalutation of runtime.js.
g.regeneratorRuntime = undefined;

module.exports = interopDefault(require$$0$29);

if (hadRuntime) {
  // Restore the original runtime.
  g.regeneratorRuntime = oldRuntime;
} else {
  // Remove the global property added by runtime.js.
  try {
    delete g.regeneratorRuntime;
  } catch(e) {
    g.regeneratorRuntime = undefined;
  }
}
});

var runtimeModule$1 = interopDefault(runtimeModule);


var require$$0$28 = Object.freeze({
  default: runtimeModule$1
});

var require$$0$28 = Object.freeze({
  default: runtimeModule$1
});

var index$2 = createCommonjsModule(function (module) {
module.exports = interopDefault(require$$0$28);
});

var _regeneratorRuntime = interopDefault(index$2);

var _anInstance = createCommonjsModule(function (module) {
module.exports = function(it, Constructor, name, forbiddenField){
  if(!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)){
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};
});

var _anInstance$1 = interopDefault(_anInstance);


var require$$11 = Object.freeze({
  default: _anInstance$1
});

var require$$11 = Object.freeze({
  default: _anInstance$1
});

var _forOf = createCommonjsModule(function (module) {
var ctx         = interopDefault(require$$5)
  , call        = interopDefault(require$$4$4)
  , isArrayIter = interopDefault(require$$3$5)
  , anObject    = interopDefault(require$$2$1)
  , toLength    = interopDefault(require$$1$9)
  , getIterFn   = interopDefault(require$$0$15)
  , BREAK       = {}
  , RETURN      = {};
var exports = module.exports = function(iterable, entries, fn, that, ITERATOR){
  var iterFn = ITERATOR ? function(){ return iterable; } : getIterFn(iterable)
    , f      = ctx(fn, that, entries ? 2 : 1)
    , index  = 0
    , length, step, iterator, result;
  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if(result === BREAK || result === RETURN)return result;
  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
    result = call(iterator, f, step.value, entries);
    if(result === BREAK || result === RETURN)return result;
  }
};
exports.BREAK  = BREAK;
exports.RETURN = RETURN;
});

var _forOf$1 = interopDefault(_forOf);


var require$$10 = Object.freeze({
  default: _forOf$1
});

var require$$10 = Object.freeze({
  default: _forOf$1
});

var _setProto = createCommonjsModule(function (module) {
// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = interopDefault(require$$3)
  , anObject = interopDefault(require$$2$1);
var check = function(O, proto){
  anObject(O);
  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function(test, buggy, set){
      try {
        set = interopDefault(require$$5)(Function.call, interopDefault(require$$0$27).f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch(e){ buggy = true; }
      return function setPrototypeOf(O, proto){
        check(O, proto);
        if(buggy)O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};
});

var _setProto$1 = interopDefault(_setProto);
var set = _setProto.set;
var check = _setProto.check;

var require$$9$1 = Object.freeze({
  default: _setProto$1,
  set: set,
  check: check
});

var require$$9$1 = Object.freeze({
  default: _setProto$1,
  set: set,
  check: check
});

var _speciesConstructor = createCommonjsModule(function (module) {
// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject  = interopDefault(require$$2$1)
  , aFunction = interopDefault(require$$1$1)
  , SPECIES   = interopDefault(require$$0$14)('species');
module.exports = function(O, D){
  var C = anObject(O).constructor, S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};
});

var _speciesConstructor$1 = interopDefault(_speciesConstructor);


var require$$8$1 = Object.freeze({
  default: _speciesConstructor$1
});

var require$$8$1 = Object.freeze({
  default: _speciesConstructor$1
});

var _invoke = createCommonjsModule(function (module) {
// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function(fn, args, that){
  var un = that === undefined;
  switch(args.length){
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return              fn.apply(that, args);
};
});

var _invoke$1 = interopDefault(_invoke);


var require$$4$7 = Object.freeze({
  default: _invoke$1
});

var require$$4$7 = Object.freeze({
  default: _invoke$1
});

var _task = createCommonjsModule(function (module) {
var ctx                = interopDefault(require$$5)
  , invoke             = interopDefault(require$$4$7)
  , html               = interopDefault(require$$3$3)
  , cel                = interopDefault(require$$2$2)
  , global             = interopDefault(require$$4)
  , process            = global.process
  , setTask            = global.setImmediate
  , clearTask          = global.clearImmediate
  , MessageChannel     = global.MessageChannel
  , counter            = 0
  , queue              = {}
  , ONREADYSTATECHANGE = 'onreadystatechange'
  , defer, channel, port;
var run = function(){
  var id = +this;
  if(queue.hasOwnProperty(id)){
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listener = function(event){
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if(!setTask || !clearTask){
  setTask = function setImmediate(fn){
    var args = [], i = 1;
    while(arguments.length > i)args.push(arguments[i++]);
    queue[++counter] = function(){
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id){
    delete queue[id];
  };
  // Node.js 0.8-
  if(interopDefault(require$$0$10)(process) == 'process'){
    defer = function(id){
      process.nextTick(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if(MessageChannel){
    channel = new MessageChannel;
    port    = channel.port2;
    channel.port1.onmessage = listener;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
    defer = function(id){
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listener, false);
  // IE8-
  } else if(ONREADYSTATECHANGE in cel('script')){
    defer = function(id){
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function(id){
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set:   setTask,
  clear: clearTask
};
});

var _task$1 = interopDefault(_task);
var set$1 = _task.set;
var clear = _task.clear;

var require$$1$14 = Object.freeze({
  default: _task$1,
  set: set$1,
  clear: clear
});

var require$$1$14 = Object.freeze({
  default: _task$1,
  set: set$1,
  clear: clear
});

var _microtask = createCommonjsModule(function (module) {
var global    = interopDefault(require$$4)
  , macrotask = interopDefault(require$$1$14).set
  , Observer  = global.MutationObserver || global.WebKitMutationObserver
  , process   = global.process
  , Promise   = global.Promise
  , isNode    = interopDefault(require$$0$10)(process) == 'process';

module.exports = function(){
  var head, last, notify;

  var flush = function(){
    var parent, fn;
    if(isNode && (parent = process.domain))parent.exit();
    while(head){
      fn   = head.fn;
      head = head.next;
      try {
        fn();
      } catch(e){
        if(head)notify();
        else last = undefined;
        throw e;
      }
    } last = undefined;
    if(parent)parent.enter();
  };

  // Node.js
  if(isNode){
    notify = function(){
      process.nextTick(flush);
    };
  // browsers with MutationObserver
  } else if(Observer){
    var toggle = true
      , node   = document.createTextNode('');
    new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
    notify = function(){
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if(Promise && Promise.resolve){
    var promise = Promise.resolve();
    notify = function(){
      promise.then(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function(){
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global, flush);
    };
  }

  return function(fn){
    var task = {fn: fn, next: undefined};
    if(last)last.next = task;
    if(!head){
      head = task;
      notify();
    } last = task;
  };
};
});

var _microtask$1 = interopDefault(_microtask);


var require$$6 = Object.freeze({
  default: _microtask$1
});

var require$$6 = Object.freeze({
  default: _microtask$1
});

var _redefineAll = createCommonjsModule(function (module) {
var hide = interopDefault(require$$0$3);
module.exports = function(target, src, safe){
  for(var key in src){
    if(safe && target[key])target[key] = src[key];
    else hide(target, key, src[key]);
  } return target;
};
});

var _redefineAll$1 = interopDefault(_redefineAll);


var require$$4$8 = Object.freeze({
  default: _redefineAll$1
});

var require$$4$8 = Object.freeze({
  default: _redefineAll$1
});

var _setSpecies = createCommonjsModule(function (module) {
'use strict';
var global      = interopDefault(require$$4)
  , core        = interopDefault(require$$0$2)
  , dP          = interopDefault(require$$2)
  , DESCRIPTORS = interopDefault(require$$1$3)
  , SPECIES     = interopDefault(require$$0$14)('species');

module.exports = function(KEY){
  var C = typeof core[KEY] == 'function' ? core[KEY] : global[KEY];
  if(DESCRIPTORS && C && !C[SPECIES])dP.f(C, SPECIES, {
    configurable: true,
    get: function(){ return this; }
  });
};
});

var _setSpecies$1 = interopDefault(_setSpecies);


var require$$2$6 = Object.freeze({
  default: _setSpecies$1
});

var require$$2$6 = Object.freeze({
  default: _setSpecies$1
});

var es6_promise = createCommonjsModule(function (module) {
'use strict';
var LIBRARY            = interopDefault(require$$19)
  , global             = interopDefault(require$$4)
  , ctx                = interopDefault(require$$5)
  , classof            = interopDefault(require$$16)
  , $export            = interopDefault(require$$1)
  , isObject           = interopDefault(require$$3)
  , anObject           = interopDefault(require$$2$1)
  , aFunction          = interopDefault(require$$1$1)
  , anInstance         = interopDefault(require$$11)
  , forOf              = interopDefault(require$$10)
  , setProto           = interopDefault(require$$9$1).set
  , speciesConstructor = interopDefault(require$$8$1)
  , task               = interopDefault(require$$1$14).set
  , microtask          = interopDefault(require$$6)()
  , PROMISE            = 'Promise'
  , TypeError          = global.TypeError
  , process            = global.process
  , $Promise           = global[PROMISE]
  , process            = global.process
  , isNode             = classof(process) == 'process'
  , empty              = function(){ /* empty */ }
  , Internal, GenericPromiseCapability, Wrapper;

var USE_NATIVE = !!function(){
  try {
    // correct subclassing with @@species support
    var promise     = $Promise.resolve(1)
      , FakePromise = (promise.constructor = {})[interopDefault(require$$0$14)('species')] = function(exec){ exec(empty, empty); };
    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    return (isNode || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;
  } catch(e){ /* empty */ }
}();

// helpers
var sameConstructor = function(a, b){
  // with library wrapper special case
  return a === b || a === $Promise && b === Wrapper;
};
var isThenable = function(it){
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var newPromiseCapability = function(C){
  return sameConstructor($Promise, C)
    ? new PromiseCapability(C)
    : new GenericPromiseCapability(C);
};
var PromiseCapability = GenericPromiseCapability = function(C){
  var resolve, reject;
  this.promise = new C(function($$resolve, $$reject){
    if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject  = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject  = aFunction(reject);
};
var perform = function(exec){
  try {
    exec();
  } catch(e){
    return {error: e};
  }
};
var notify = function(promise, isReject){
  if(promise._n)return;
  promise._n = true;
  var chain = promise._c;
  microtask(function(){
    var value = promise._v
      , ok    = promise._s == 1
      , i     = 0;
    var run = function(reaction){
      var handler = ok ? reaction.ok : reaction.fail
        , resolve = reaction.resolve
        , reject  = reaction.reject
        , domain  = reaction.domain
        , result, then;
      try {
        if(handler){
          if(!ok){
            if(promise._h == 2)onHandleUnhandled(promise);
            promise._h = 1;
          }
          if(handler === true)result = value;
          else {
            if(domain)domain.enter();
            result = handler(value);
            if(domain)domain.exit();
          }
          if(result === reaction.promise){
            reject(TypeError('Promise-chain cycle'));
          } else if(then = isThenable(result)){
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch(e){
        reject(e);
      }
    };
    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
    promise._c = [];
    promise._n = false;
    if(isReject && !promise._h)onUnhandled(promise);
  });
};
var onUnhandled = function(promise){
  task.call(global, function(){
    var value = promise._v
      , abrupt, handler, console;
    if(isUnhandled(promise)){
      abrupt = perform(function(){
        if(isNode){
          process.emit('unhandledRejection', value, promise);
        } else if(handler = global.onunhandledrejection){
          handler({promise: promise, reason: value});
        } else if((console = global.console) && console.error){
          console.error('Unhandled promise rejection', value);
        }
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
    } promise._a = undefined;
    if(abrupt)throw abrupt.error;
  });
};
var isUnhandled = function(promise){
  if(promise._h == 1)return false;
  var chain = promise._a || promise._c
    , i     = 0
    , reaction;
  while(chain.length > i){
    reaction = chain[i++];
    if(reaction.fail || !isUnhandled(reaction.promise))return false;
  } return true;
};
var onHandleUnhandled = function(promise){
  task.call(global, function(){
    var handler;
    if(isNode){
      process.emit('rejectionHandled', promise);
    } else if(handler = global.onrejectionhandled){
      handler({promise: promise, reason: promise._v});
    }
  });
};
var $reject = function(value){
  var promise = this;
  if(promise._d)return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  promise._v = value;
  promise._s = 2;
  if(!promise._a)promise._a = promise._c.slice();
  notify(promise, true);
};
var $resolve = function(value){
  var promise = this
    , then;
  if(promise._d)return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  try {
    if(promise === value)throw TypeError("Promise can't be resolved itself");
    if(then = isThenable(value)){
      microtask(function(){
        var wrapper = {_w: promise, _d: false}; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch(e){
          $reject.call(wrapper, e);
        }
      });
    } else {
      promise._v = value;
      promise._s = 1;
      notify(promise, false);
    }
  } catch(e){
    $reject.call({_w: promise, _d: false}, e); // wrap
  }
};

// constructor polyfill
if(!USE_NATIVE){
  // 25.4.3.1 Promise(executor)
  $Promise = function Promise(executor){
    anInstance(this, $Promise, PROMISE, '_h');
    aFunction(executor);
    Internal.call(this);
    try {
      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
    } catch(err){
      $reject.call(this, err);
    }
  };
  Internal = function Promise(executor){
    this._c = [];             // <- awaiting reactions
    this._a = undefined;      // <- checked in isUnhandled reactions
    this._s = 0;              // <- state
    this._d = false;          // <- done
    this._v = undefined;      // <- value
    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
    this._n = false;          // <- notify
  };
  Internal.prototype = interopDefault(require$$4$8)($Promise.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected){
      var reaction    = newPromiseCapability(speciesConstructor(this, $Promise));
      reaction.ok     = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail   = typeof onRejected == 'function' && onRejected;
      reaction.domain = isNode ? process.domain : undefined;
      this._c.push(reaction);
      if(this._a)this._a.push(reaction);
      if(this._s)notify(this, false);
      return reaction.promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function(onRejected){
      return this.then(undefined, onRejected);
    }
  });
  PromiseCapability = function(){
    var promise  = new Internal;
    this.promise = promise;
    this.resolve = ctx($resolve, promise, 1);
    this.reject  = ctx($reject, promise, 1);
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: $Promise});
interopDefault(require$$3$4)($Promise, PROMISE);
interopDefault(require$$2$6)(PROMISE);
Wrapper = interopDefault(require$$0$2)[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r){
    var capability = newPromiseCapability(this)
      , $$reject   = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x){
    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
    if(x instanceof $Promise && sameConstructor(x.constructor, this))return x;
    var capability = newPromiseCapability(this)
      , $$resolve  = capability.resolve;
    $$resolve(x);
    return capability.promise;
  }
});
$export($export.S + $export.F * !(USE_NATIVE && interopDefault(require$$0$16)(function(iter){
  $Promise.all(iter)['catch'](empty);
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable){
    var C          = this
      , capability = newPromiseCapability(C)
      , resolve    = capability.resolve
      , reject     = capability.reject;
    var abrupt = perform(function(){
      var values    = []
        , index     = 0
        , remaining = 1;
      forOf(iterable, false, function(promise){
        var $index        = index++
          , alreadyCalled = false;
        values.push(undefined);
        remaining++;
        C.resolve(promise).then(function(value){
          if(alreadyCalled)return;
          alreadyCalled  = true;
          values[$index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable){
    var C          = this
      , capability = newPromiseCapability(C)
      , reject     = capability.reject;
    var abrupt = perform(function(){
      forOf(iterable, false, function(promise){
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if(abrupt)reject(abrupt.error);
    return capability.promise;
  }
});
});

interopDefault(es6_promise);

var promise$2 = createCommonjsModule(function (module) {
module.exports = interopDefault(require$$0$2).Promise;
});

var promise$3 = interopDefault(promise$2);


var require$$0$31 = Object.freeze({
	default: promise$3
});

var require$$0$31 = Object.freeze({
	default: promise$3
});

var promise = createCommonjsModule(function (module) {
module.exports = { "default": interopDefault(require$$0$31), __esModule: true };
});

var promise$1 = interopDefault(promise);


var require$$0$30 = Object.freeze({
	default: promise$1
});

var require$$0$30 = Object.freeze({
	default: promise$1
});

var asyncToGenerator = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

var _promise = interopDefault(require$$0$30);

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new _promise2.default(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return _promise2.default.resolve(value).then(function (value) {
            return step("next", value);
          }, function (err) {
            return step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};
});

var _asyncToGenerator = interopDefault(asyncToGenerator);

var _objectAssign = createCommonjsModule(function (module) {
'use strict';
// 19.1.2.1 Object.assign(target, source, ...)
var getKeys  = interopDefault(require$$5$2)
  , gOPS     = interopDefault(require$$4$6)
  , pIE      = interopDefault(require$$3$7)
  , toObject = interopDefault(require$$2$4)
  , IObject  = interopDefault(require$$1$7)
  , $assign  = Object.assign;

// should work with symbols and should have deterministic property order (V8 bug)
module.exports = !$assign || interopDefault(require$$0$4)(function(){
  var A = {}
    , B = {}
    , S = Symbol()
    , K = 'abcdefghijklmnopqrst';
  A[S] = 7;
  K.split('').forEach(function(k){ B[k] = k; });
  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
  var T     = toObject(target)
    , aLen  = arguments.length
    , index = 1
    , getSymbols = gOPS.f
    , isEnum     = pIE.f;
  while(aLen > index){
    var S      = IObject(arguments[index++])
      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
      , length = keys.length
      , j      = 0
      , key;
    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
  } return T;
} : $assign;
});

var _objectAssign$1 = interopDefault(_objectAssign);


var require$$0$33 = Object.freeze({
  default: _objectAssign$1
});

var require$$0$33 = Object.freeze({
  default: _objectAssign$1
});

var es6_object_assign = createCommonjsModule(function (module) {
// 19.1.3.1 Object.assign(target, source)
var $export = interopDefault(require$$1);

$export($export.S + $export.F, 'Object', {assign: interopDefault(require$$0$33)});
});

interopDefault(es6_object_assign);

var assign$1 = createCommonjsModule(function (module) {
module.exports = interopDefault(require$$0$2).Object.assign;
});

var assign$2 = interopDefault(assign$1);


var require$$0$32 = Object.freeze({
	default: assign$2
});

var require$$0$32 = Object.freeze({
	default: assign$2
});

var assign = createCommonjsModule(function (module) {
module.exports = { "default": interopDefault(require$$0$32), __esModule: true };
});

var _Object$assign = interopDefault(assign);

var classCallCheck = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

exports.default = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};
});

var _classCallCheck = interopDefault(classCallCheck);

var createClass = createCommonjsModule(function (module, exports) {
"use strict";

exports.__esModule = true;

var _defineProperty = interopDefault(require$$0);

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      (0, _defineProperty2.default)(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();
});

var _createClass = interopDefault(createClass);

var constants = {
  ERR_UNKNOWN: "an unknown error occurred. Check the stacktrace or report an\n     issue if there is a problem with trilogy itself.",
  ERR_COL_MISSING: "column name is required. Pass it as an independent argument\n     or as dot-notation along with the table argument.",
  ERR_NO_DATABASE: "Could not write - no database initialized."
};

var objToStr = Object.prototype.toString;

function isObject(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof$1(value);
  return value && (type === 'object' || type === 'function');
}

function isFunction(value) {
  var type = isObject(value) ? objToStr.call(value) : '';
  return type === '[object Function]' || type === '[object GeneratorFunction]';
}

function isString(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof$1(value);
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
        var _this = this;

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

                return _context.abrupt('return', new Promise$1(function (resolve, reject) {
                  try {
                    _this.db.run(query);
                    _this._write();
                    return resolve();
                  } catch (e) {
                    return reject(e);
                  }
                }));

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
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
        var _this2 = this;

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

                return _context2.abrupt('return', new Promise$1(function (resolve, reject) {
                  try {
                    var val = _this2.db.exec(query);
                    return resolve(val);
                  } catch (e) {
                    return reject(e);
                  }
                }));

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
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
                  map(columns, function (column) {
                    if (isPlainObject(column)) {
                      var _ret = function () {
                        if (!column.name) return {
                            v: void 0
                          };
                        if (!column.type || !(column.type in table)) column.type = 'text';
                        var partial = table[column.type](column.name);

                        map(column, function (attr, prop) {
                          // name & type are handled above
                          if (prop === 'name' || prop === 'type') return;
                          if (!(prop in partial)) return;

                          // handle methods that take no arguments
                          switch (prop) {
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

                      if ((typeof _ret === 'undefined' ? 'undefined' : _typeof$1(_ret)) === "object") return _ret.v;
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
                return _context3.abrupt('return', Promise$1.resolve());

              case 9:
                _context3.prev = 9;
                _context3.t0 = _context3['catch'](3);
                return _context3.abrupt('return', this._errorHandler(_context3.t0));

              case 12:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[3, 9]]);
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
                return _context4.abrupt('return', Promise$1.resolve(res > 0));

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
      var _ref5 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee5(tableName, values) {
        var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
        var query, str;
        return _regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!(!tableName || !isString(tableName))) {
                  _context5.next = 2;
                  break;
                }

                return _context5.abrupt('return', this._errorHandler('#insert', '\'tableName\' must be a string'));

              case 2:
                query = this.knex.table(tableName).insert(values);

                // Knex doesn't have support for conflict clauses yet :(

                if (options.conflict) {
                  str = Trilogy._getConflictString(options.conflict);

                  query = query.toString().replace('insert into', 'insert' + str + 'into');
                }

                _context5.prev = 4;
                _context5.next = 7;
                return this.run(query);

              case 7:
                return _context5.abrupt('return', Promise$1.resolve(this.db.getRowsModified()));

              case 10:
                _context5.prev = 10;
                _context5.t0 = _context5['catch'](4);
                return _context5.abrupt('return', this._errorHandler(_context5.t0));

              case 13:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this, [[4, 10]]);
      }));

      function insert(_x9, _x10, _x11) {
        return _ref5.apply(this, arguments);
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
      var _ref6 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee7() {
        var _this3 = this;

        var _args7 = arguments;
        return _regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                return _context7.abrupt('return', arify(function (v) {
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
                  var _ref7 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee6(args) {
                    var columns, partial, query, result, res;
                    return _regeneratorRuntime.wrap(function _callee6$(_context6) {
                      while (1) {
                        switch (_context6.prev = _context6.next) {
                          case 0:
                            columns = Trilogy._sanitizeColumns(args.columns);
                            partial = _this3.knex.column(columns).table(args.table);
                            query = Trilogy._sanitizeWhere(args.where, partial);


                            if (args.options.random) {
                              query = query.orderByRaw('RANDOM()');
                            } else if (args.options.order) {
                              query = Trilogy._sanitizeOrder(args.options.order, partial);
                            }

                            _context6.prev = 4;
                            _context6.next = 7;
                            return _this3.exec(query);

                          case 7:
                            result = _context6.sent;
                            res = Trilogy._parseResponse(result);
                            return _context6.abrupt('return', Promise$1.resolve(res));

                          case 12:
                            _context6.prev = 12;
                            _context6.t0 = _context6['catch'](4);

                            if (!_context6.t0.message.endsWith('of undefined')) {
                              _context6.next = 16;
                              break;
                            }

                            return _context6.abrupt('return', Promise$1.resolve(undefined));

                          case 16:
                            return _context6.abrupt('return', _this3._errorHandler(_context6.t0));

                          case 17:
                          case 'end':
                            return _context6.stop();
                        }
                      }
                    }, _callee6, _this3, [[4, 12]]);
                  }));

                  return function (_x14) {
                    return _ref7.apply(this, arguments);
                  };
                }()).apply(undefined, _args7));

              case 1:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function select(_x13) {
        return _ref6.apply(this, arguments);
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
      var _ref8 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee9() {
        var _this4 = this;

        var _args9 = arguments;
        return _regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                return _context9.abrupt('return', arify(function (v) {
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
                  var _ref9 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee8(args) {
                    var columns, partial, query, result, res;
                    return _regeneratorRuntime.wrap(function _callee8$(_context8) {
                      while (1) {
                        switch (_context8.prev = _context8.next) {
                          case 0:
                            columns = Trilogy._sanitizeColumns(args.columns);
                            partial = _this4.knex.table(args.table).first(columns);
                            query = Trilogy._sanitizeWhere(args.where, partial);


                            if (args.options.random) {
                              query = query.orderByRaw('RANDOM()');
                            }

                            _context8.prev = 4;
                            _context8.next = 7;
                            return _this4.exec(query);

                          case 7:
                            result = _context8.sent;
                            res = Trilogy._parseResponse(result);
                            return _context8.abrupt('return', Promise$1.resolve(res[0]));

                          case 12:
                            _context8.prev = 12;
                            _context8.t0 = _context8['catch'](4);

                            if (!_context8.t0.message.endsWith('of undefined')) {
                              _context8.next = 16;
                              break;
                            }

                            return _context8.abrupt('return', Promise$1.resolve(undefined));

                          case 16:
                            return _context8.abrupt('return', _this4._errorHandler(_context8.t0));

                          case 17:
                          case 'end':
                            return _context8.stop();
                        }
                      }
                    }, _callee8, _this4, [[4, 12]]);
                  }));

                  return function (_x16) {
                    return _ref9.apply(this, arguments);
                  };
                }()).apply(undefined, _args9));

              case 1:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function first(_x15) {
        return _ref8.apply(this, arguments);
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
      var _ref10 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee11() {
        var _this5 = this;

        var _args11 = arguments;
        return _regeneratorRuntime.wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                return _context11.abrupt('return', arify(function (v) {
                  v.str('table').str('column').add('where', {
                    test: function test(value) {
                      return Trilogy._isValidWhere(value);
                    },
                    description: 'an object, array, or function',
                    defaultValue: ['1', '=', '1']
                  });

                  v.form('table', '?column', 'where');
                }, function () {
                  var _ref11 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee10(args) {
                    var _Trilogy$_parseTableP, _Trilogy$_parseTableP2, tbl, col, partial, query, result, res;

                    return _regeneratorRuntime.wrap(function _callee10$(_context10) {
                      while (1) {
                        switch (_context10.prev = _context10.next) {
                          case 0:
                            _Trilogy$_parseTableP = Trilogy._parseTablePath(args.table, args.column);
                            _Trilogy$_parseTableP2 = _slicedToArray(_Trilogy$_parseTableP, 2);
                            tbl = _Trilogy$_parseTableP2[0];
                            col = _Trilogy$_parseTableP2[1];

                            if (col) {
                              _context10.next = 6;
                              break;
                            }

                            return _context10.abrupt('return', _this5._errorHandler(constants.ERR_COL_MISSING));

                          case 6:
                            partial = _this5.knex.table(tbl).first(col);
                            query = Trilogy._sanitizeWhere(args.where, partial);
                            _context10.prev = 8;
                            _context10.next = 11;
                            return _this5.exec(query);

                          case 11:
                            result = _context10.sent;
                            res = Trilogy._parseResponse(result);
                            return _context10.abrupt('return', Promise$1.resolve(res[0][col]));

                          case 16:
                            _context10.prev = 16;
                            _context10.t0 = _context10['catch'](8);

                            if (!_context10.t0.message.endsWith('of undefined')) {
                              _context10.next = 20;
                              break;
                            }

                            return _context10.abrupt('return', Promise$1.resolve(undefined));

                          case 20:
                            return _context10.abrupt('return', _this5._errorHandler(_context10.t0));

                          case 21:
                          case 'end':
                            return _context10.stop();
                        }
                      }
                    }, _callee10, _this5, [[8, 16]]);
                  }));

                  return function (_x18) {
                    return _ref11.apply(this, arguments);
                  };
                }()).apply(undefined, _args11));

              case 1:
              case 'end':
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function getValue(_x17) {
        return _ref10.apply(this, arguments);
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
      var _ref12 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee13() {
        var _this6 = this;

        var _args13 = arguments;
        return _regeneratorRuntime.wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                return _context13.abrupt('return', arify(function (v) {
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
                  var _ref13 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee12(args) {
                    var partial, update, query, str;
                    return _regeneratorRuntime.wrap(function _callee12$(_context12) {
                      while (1) {
                        switch (_context12.prev = _context12.next) {
                          case 0:
                            partial = _this6.knex.table(args.table);
                            update = isPlainObject(args.values) ? partial.update(args.values) : partial.update.apply(partial, _toConsumableArray(args.values));
                            query = Trilogy._sanitizeWhere(args.where, update);

                            // Knex doesn't have support for conflict clauses yet :(

                            if (args.options.conflict) {
                              str = Trilogy._getConflictString(args.options.conflict);

                              query = query.toString().replace('update', 'update' + str);
                            }

                            _context12.prev = 4;
                            _context12.next = 7;
                            return _this6.run(query);

                          case 7:
                            return _context12.abrupt('return', Promise$1.resolve(_this6.db.getRowsModified()));

                          case 10:
                            _context12.prev = 10;
                            _context12.t0 = _context12['catch'](4);
                            return _context12.abrupt('return', _this6._errorHandler(_context12.t0));

                          case 13:
                          case 'end':
                            return _context12.stop();
                        }
                      }
                    }, _callee12, _this6, [[4, 10]]);
                  }));

                  return function (_x20) {
                    return _ref13.apply(this, arguments);
                  };
                }()).apply(undefined, _args13));

              case 1:
              case 'end':
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function update(_x19) {
        return _ref12.apply(this, arguments);
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
      var _ref14 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee15() {
        var _this7 = this;

        var _args15 = arguments;
        return _regeneratorRuntime.wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                return _context15.abrupt('return', arify(function (v) {
                  v.str('table').str('column').num('amount', 1).add('where', {
                    test: function test(value) {
                      return Trilogy._isValidWhere(value);
                    },
                    description: 'an object, array, or function',
                    defaultValue: ['1', '=', '1']
                  });

                  v.form('table', '?column', '?amount', '?where');
                }, function () {
                  var _ref15 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee14(args) {
                    var _Trilogy$_parseTableP3, _Trilogy$_parseTableP4, tbl, col, partial, query;

                    return _regeneratorRuntime.wrap(function _callee14$(_context14) {
                      while (1) {
                        switch (_context14.prev = _context14.next) {
                          case 0:
                            _Trilogy$_parseTableP3 = Trilogy._parseTablePath(args.table, args.column);
                            _Trilogy$_parseTableP4 = _slicedToArray(_Trilogy$_parseTableP3, 2);
                            tbl = _Trilogy$_parseTableP4[0];
                            col = _Trilogy$_parseTableP4[1];

                            if (col) {
                              _context14.next = 6;
                              break;
                            }

                            return _context14.abrupt('return', _this7._errorHandler(constants.ERR_COL_MISSING));

                          case 6:
                            partial = _this7.knex.table(tbl).increment(col, args.amount);
                            query = Trilogy._sanitizeWhere(args.where, partial);
                            _context14.prev = 8;
                            _context14.next = 11;
                            return _this7.run(query);

                          case 11:
                            return _context14.abrupt('return', Promise$1.resolve());

                          case 14:
                            _context14.prev = 14;
                            _context14.t0 = _context14['catch'](8);
                            return _context14.abrupt('return', _this7._errorHandler(_context14.t0));

                          case 17:
                          case 'end':
                            return _context14.stop();
                        }
                      }
                    }, _callee14, _this7, [[8, 14]]);
                  }));

                  return function (_x22) {
                    return _ref15.apply(this, arguments);
                  };
                }()).apply(undefined, _args15));

              case 1:
              case 'end':
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function increment(_x21) {
        return _ref14.apply(this, arguments);
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
      var _ref16 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee17() {
        var _this8 = this;

        var _args17 = arguments;
        return _regeneratorRuntime.wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                return _context17.abrupt('return', arify(function (v) {
                  v.str('table').str('column').num('amount', 1).bln('allowNegative', false).add('where', {
                    test: function test(value) {
                      return Trilogy._isValidWhere(value);
                    },
                    description: 'an object, array, or function',
                    defaultValue: ['1', '=', '1']
                  });

                  v.form('table', '?column', '?amount', '?where', '?allowNegative');
                }, function () {
                  var _ref17 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee16(args) {
                    var _Trilogy$_parseTableP5, _Trilogy$_parseTableP6, tbl, col, partial, rawStr, updated, query;

                    return _regeneratorRuntime.wrap(function _callee16$(_context16) {
                      while (1) {
                        switch (_context16.prev = _context16.next) {
                          case 0:
                            _Trilogy$_parseTableP5 = Trilogy._parseTablePath(args.table, args.column);
                            _Trilogy$_parseTableP6 = _slicedToArray(_Trilogy$_parseTableP5, 2);
                            tbl = _Trilogy$_parseTableP6[0];
                            col = _Trilogy$_parseTableP6[1];

                            if (col) {
                              _context16.next = 6;
                              break;
                            }

                            return _context16.abrupt('return', _this8._errorHandler(constants.ERR_COL_MISSING));

                          case 6:
                            partial = _this8.knex.table(tbl);
                            rawStr = args.allowNegative ? col + ' - ' + args.amount : 'MAX(0, ' + col + ' - ' + args.amount + ')';
                            updated = partial.update(_defineProperty({}, col, _this8.knex.raw(rawStr)));
                            query = Trilogy._sanitizeWhere(args.where, updated);
                            _context16.prev = 10;
                            _context16.next = 13;
                            return _this8.run(query);

                          case 13:
                            return _context16.abrupt('return', Promise$1.resolve());

                          case 16:
                            _context16.prev = 16;
                            _context16.t0 = _context16['catch'](10);
                            return _context16.abrupt('return', _this8._errorHandler(_context16.t0));

                          case 19:
                          case 'end':
                            return _context16.stop();
                        }
                      }
                    }, _callee16, _this8, [[10, 16]]);
                  }));

                  return function (_x24) {
                    return _ref17.apply(this, arguments);
                  };
                }()).apply(undefined, _args17));

              case 1:
              case 'end':
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function decrement(_x23) {
        return _ref16.apply(this, arguments);
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
      var _ref18 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee19() {
        var _this9 = this;

        var _args19 = arguments;
        return _regeneratorRuntime.wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                return _context19.abrupt('return', arify(function (v) {
                  v.str('table').add('where', {
                    test: function test(value) {
                      return Trilogy._isValidWhere(value);
                    },
                    description: 'an object, array, or function',
                    defaultValue: ['1', '=', '1']
                  });

                  v.form('table', '?where');
                }, function () {
                  var _ref19 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee18(args) {
                    var partial, query;
                    return _regeneratorRuntime.wrap(function _callee18$(_context18) {
                      while (1) {
                        switch (_context18.prev = _context18.next) {
                          case 0:
                            partial = _this9.knex.table(args.table).del();
                            query = Trilogy._sanitizeWhere(args.where, partial);
                            _context18.prev = 2;
                            _context18.next = 5;
                            return _this9.run(query);

                          case 5:
                            return _context18.abrupt('return', Promise$1.resolve(_this9.db.getRowsModified()));

                          case 8:
                            _context18.prev = 8;
                            _context18.t0 = _context18['catch'](2);
                            return _context18.abrupt('return', _this9._errorHandler(_context18.t0));

                          case 11:
                          case 'end':
                            return _context18.stop();
                        }
                      }
                    }, _callee18, _this9, [[2, 8]]);
                  }));

                  return function (_x26) {
                    return _ref19.apply(this, arguments);
                  };
                }()).apply(undefined, _args19));

              case 1:
              case 'end':
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function del(_x25) {
        return _ref18.apply(this, arguments);
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
      var _this10 = this;

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
          partial = _this10.knex.table(args.table).countDistinct(args.column + ' as count');
        } else {
          partial = _this10.knex.table(args.table).count(args.column + ' as count');
        }

        var query = Trilogy._sanitizeWhere(args.where, partial).toString();

        try {
          var statement = _this10.db.prepare(query);
          var res = statement.getAsObject({});

          if (isPlainObject(res) && 'count' in res) {
            return Promise$1.resolve(res.count);
          } else {
            return Promise$1.resolve(0);
          }
        } catch (e) {
          return _this10._errorHandler(e);
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
      var _ref20 = _asyncToGenerator(_regeneratorRuntime.mark(function _callee20(query) {
        var ret = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        var done;
        return _regeneratorRuntime.wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                _context20.prev = 0;

                if (!ret) {
                  _context20.next = 7;
                  break;
                }

                _context20.next = 4;
                return this.exec(query);

              case 4:
                _context20.t0 = _context20.sent;
                _context20.next = 10;
                break;

              case 7:
                _context20.next = 9;
                return this.run(query);

              case 9:
                _context20.t0 = _context20.sent;

              case 10:
                done = _context20.t0;
                return _context20.abrupt('return', Promise$1.resolve(ret ? done : undefined));

              case 14:
                _context20.prev = 14;
                _context20.t1 = _context20['catch'](0);
                return _context20.abrupt('return', this._errorHandler(_context20.t1));

              case 17:
              case 'end':
                return _context20.stop();
            }
          }
        }, _callee20, this, [[0, 14]]);
      }));

      function raw(_x27, _x28) {
        return _ref20.apply(this, arguments);
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
        e.message = arguments.length === 1 ? 'Trilogy :: ' + err : 'Trilogy' + err + ' :: ' + msg;
      }

      e.name = 'TrilogyError';

      if (this.errorListener) {
        this.errorListener(e);
      }

      return Promise$1.reject(e);
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
            line[columns[j]] = values[i][j];
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
        return partial.where.apply(partial, _toConsumableArray(where));
      } else if (isFunction(where)) {
        return partial.where(where.bind(partial));
      } else {
        // it's an object
        return partial.where(where);
      }
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