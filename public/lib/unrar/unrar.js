// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module.exports = Module;
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  Module['print'] = function(x) {
    console.log(x);
  };
  Module['printErr'] = function(x) {
    console.log(x);
  };
  this['Module'] = Module;
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
    dump(x);
  }) : (function(x) {
    // self.postMessage(x); // enable this if you want stdout to be sent as messages
  }));
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          alignSize = type.alignSize || QUANTUM_SIZE;
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func) {
    var table = FUNCTION_TABLE;
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE;
    table[index] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? (((low)>>>(0))+(((high)>>>(0))*4294967296)) : (((low)>>>(0))+(((high)|(0))*4294967296))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 52428800;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 167772160;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addOnPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
}
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 22192;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stderr;
var _stderr = _stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([6,70,70,70,41,41,69,69,9,70,70,70,70,41,41,41,41,41,41,1,1,17,16,5,70,70,70,69,0,0,32,64,2,2,6,6,6,102,102,0,0,0,0,0,64,0,0,0,96,0,0,0,160,0,0,0,208,0,0,0,224,0,0,0,240,0,0,0,248,0,0,0,252,0,0,0,192,0,0,0,128,0,0,0,144,0,0,0,152,0,0,0,156,0,0,0,176,0,0,0,0,0,0,0,0,0,0,0,160,0,0,0,208,0,0,0,224,0,0,0,240,0,0,0,248,0,0,0,252,0,0,0,254,0,0,0,255,0,0,0,192,0,0,0,128,0,0,0,144,0,0,0,152,0,0,0,156,0,0,0,176,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,6,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,6,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,8,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,6,0,0,0,4,0,0,0,0,0,0,0,221,60,63,31,191,89,243,72,161,100,188,90,50,102,81,96,0,4,8,16,32,64,128,192,2,2,3,4,5,6,6,6,0,1,2,3,4,5,6,7,8,10,12,14,16,20,24,28,32,40,48,56,64,80,96,112,128,160,192,224,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,192,0,0,0,0,1,0,0,128,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,192,0,0,0,0,1,0,0,128,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,28,0,0,0,32,0,0,0,36,0,0,0,40,0,0,0,44,0,0,0,48,0,0,0,52,0,0,0,56,0,0,0,60,0,0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,16,16,16,16,16,16,16,16,16,16,16,16,18,18,18,18,18,18,18,18,18,18,18,18,0,0,0,0,0,4,8,16,32,64,128,192,2,2,3,4,5,6,6,6,0,1,2,3,4,5,6,7,8,10,12,14,16,20,24,28,32,40,48,56,64,80,96,112,128,160,192,224,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,192,0,0,0,0,1,0,0,128,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,192,0,0,0,0,1,0,0,128,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,16,16,16,16,16,16,16,16,16,16,16,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,7,0,0,0,9,0,0,0,13,0,0,0,18,0,0,0,22,0,0,0,26,0,0,0,34,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,5,0,0,0,7,0,0,0,11,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,32,0,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,16,0,0,0,218,0,0,0,251,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,7,0,0,0,53,0,0,0,117,0,0,0,233,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,44,0,0,0,60,0,0,0,76,0,0,0,80,0,0,0,80,0,0,0,127,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,16,0,0,0,24,0,0,0,33,0,0,0,33,0,0,0,33,0,0,0,33,0,0,0,33,0,0,0,0,0,0,0,53,0,0,0,135,104,87,173,1,0,0,0,57,0,0,0,126,229,215,60,2,0,0,0,120,0,0,0,63,137,105,55,3,0,0,0,29,0,0,0,125,7,6,14,6,0,0,0,149,0,0,0,200,93,44,28,4,0,0,0,216,0,0,0,1,231,133,188,5,0,0,0,40,0,0,0,96,197,185,70,7,0,0,0,0,0,0,0,4,4,6,6,0,0,7,7,4,4,0,0,4,4,0,0,0,160,0,0,0,192,0,0,0,208,0,0,0,224,0,0,0,234,0,0,0,238,0,0,0,240,0,0,0,242,0,0,64,242,0,0,255,255,0,0,0,128,0,0,0,160,0,0,0,192,0,0,0,208,0,0,0,224,0,0,0,234,0,0,0,238,0,0,0,240,0,0,0,242,0,0,0,242,0,0,255,255,0,0,0,0,0,0,0,255,0,0,255,255,0,0,255,255,0,0,255,255,0,0,255,255,0,0,255,255,0,0,0,8,0,0,0,36,0,0,0,238,0,0,128,254,0,0,255,255,0,0,255,255,0,0,255,255,0,0,0,0,0,0,0,16,0,0,0,36,0,0,0,128,0,0,0,192,0,0,0,250,0,0,255,255,0,0,255,255,0,0,255,255,0,0,0,32,0,0,0,192,0,0,0,224,0,0,0,240,0,0,0,242,0,0,0,242,0,0,224,247,0,0,255,255,0,0,0,128,0,0,0,192,0,0,0,224,0,0,0,242,0,0,0,242,0,0,0,242,0,0,0,242,0,0,0,242,0,0,255,255,0,0,0,0,0,0,117,110,107,110,111,119,110,32,99,111,109,112,114,101,115,115,105,111,110,32,109,101,116,104,111,100,58,32,37,100,0,0,117,110,107,110,111,119,110,32,97,114,99,104,105,118,101,32,116,121,112,101,44,32,111,110,108,121,32,112,108,97,105,110,32,82,65,82,32,50,46,48,32,115,117,112,112,111,114,116,101,100,40,110,111,114,109,97,108,32,97,110,100,32,115,111,108,105,100,32,97,114,99,104,105,118,101,115,41,44,32,83,70,88,32,97,110,100,32,86,111,108,117,109,101,115,32,97,114,101,32,78,79,84,32,115,117,112,112,111,114,116,101,100,33,10,0,0,0,0,0,0,114,0,0,0,0,0,0,0,119,43,98,0,0,0,0,0,47,116,109,112,47,117,110,114,97,114,95,116,109,112,102,95,37,48,54,100,0,0,0,0,0,4,8,16,32,64,128,192,2,2,3,4,5,6,6,6,0,1,2,3,4,5,6,7,8,10,12,14,16,20,24,28,32,40,48,56,64,80,96,112,128,160,192,224,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,192,0,0,0,0,1,0,0,128,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,48,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,192,0,0,0,0,1,0,0,128,1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,16,16,16,16,16,16,16,16,16,16,16,16,16,16,23,0,0,152,27,0,0,32,32,0,0,168,36,0,0,215,19,149,35,73,197,192,205,249,28,16,119,48,221,2,42,232,1,177,233,14,88,219,25,223,195,244,90,87,239,153,137,255,199,147,70,92,66,246,13,216,40,62,29,217,230,86,6,71,24,171,196,101,113,218,123,93,91,163,178,202,67,44,235,107,250,75,234,49,167,125,211,83,114,157,144,32,193,143,36,158,124,247,187,89,214,141,47,121,228,61,130,213,194,174,251,97,110,54,229,115,57,152,94,105,243,212,55,209,245,63,11,164,200,31,156,81,176,227,21,76,99,139,188,127,17,248,51,207,120,189,210,8,226,41,72,183,203,135,165,166,60,98,7,122,38,155,170,69,172,252,238,39,134,59,128,236,27,240,80,131,3,85,206,145,79,154,142,159,220,201,133,74,64,20,129,224,185,138,103,173,182,43,34,254,82,198,151,231,180,58,10,118,26,102,12,50,132,22,191,136,111,162,179,45,4,148,108,161,56,78,126,242,222,15,175,146,23,33,241,181,190,77,225,0,46,169,186,68,95,237,65,53,208,253,168,9,18,100,52,116,184,160,96,109,37,30,106,140,104,150,5,204,117,112,84,25,14,9,7,5,5,4,4,4,3,3,3,2,2,2,2], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
function runPostSets() {
}
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:35,EIDRM:36,ECHRNG:37,EL2NSYNC:38,EL3HLT:39,EL3RST:40,ELNRNG:41,EUNATCH:42,ENOCSI:43,EL2HLT:44,EDEADLK:45,ENOLCK:46,EBADE:50,EBADR:51,EXFULL:52,ENOANO:53,EBADRQC:54,EBADSLT:55,EDEADLOCK:56,EBFONT:57,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:74,ELBIN:75,EDOTDOT:76,EBADMSG:77,EFTYPE:79,ENOTUNIQ:80,EBADFD:81,EREMCHG:82,ELIBACC:83,ELIBBAD:84,ELIBSCN:85,ELIBMAX:86,ELIBEXEC:87,ENOSYS:88,ENMFILE:89,ENOTEMPTY:90,ENAMETOOLONG:91,ELOOP:92,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:106,EPROTOTYPE:107,ENOTSOCK:108,ENOPROTOOPT:109,ESHUTDOWN:110,ECONNREFUSED:111,EADDRINUSE:112,ECONNABORTED:113,ENETUNREACH:114,ENETDOWN:115,ETIMEDOUT:116,EHOSTDOWN:117,EHOSTUNREACH:118,EINPROGRESS:119,EALREADY:120,EDESTADDRREQ:121,EMSGSIZE:122,EPROTONOSUPPORT:123,ESOCKTNOSUPPORT:124,EADDRNOTAVAIL:125,ENETRESET:126,EISCONN:127,ENOTCONN:128,ETOOMANYREFS:129,EPROCLIM:130,EUSERS:131,EDQUOT:132,ESTALE:133,ENOTSUP:134,ENOMEDIUM:135,ENOSHARE:136,ECASECLASH:137,EILSEQ:138,EOVERFLOW:139,ECANCELED:140,ENOTRECOVERABLE:141,EOWNERDEAD:142,ESTRPIPE:143};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  var __impure_ptr=allocate(1, "i32*", ALLOC_STATIC);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,createFileHandle:function (stream, fd) {
        if (typeof stream === 'undefined') {
          stream = null;
        }
        if (!fd) {
          if (stream && stream.socket) {
            for (var i = 1; i < 64; i++) {
              if (!FS.streams[i]) {
                fd = i;
                break;
              }
            }
            assert(fd, 'ran out of low fds for sockets');
          } else {
            fd = Math.max(FS.streams.length, 64);
            for (var i = FS.streams.length; i < fd; i++) {
              FS.streams[i] = null; // Keep dense
            }
          }
        }
        // Close WebSocket first if we are about to replace the fd (i.e. dup2)
        if (FS.streams[fd] && FS.streams[fd].socket && FS.streams[fd].socket.close) {
          FS.streams[fd].socket.close();
        }
        FS.streams[fd] = stream;
        return fd;
      },removeFileHandle:function (fd) {
        FS.streams[fd] = null;
      },joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },staticInit:function () {
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
        FS.createFolder('/', 'dev', true, true);
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function createSimpleOutput() {
          var fn = function (val) {
            if (val === null || val === 10) {
              fn.printer(fn.buffer.join(''));
              fn.buffer = [];
            } else {
              fn.buffer.push(utf8.processCChar(val));
            }
          };
          return fn;
        }
        if (!output) {
          stdoutOverridden = false;
          output = createSimpleOutput();
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = createSimpleOutput();
        }
        if (!error.printer) error.printer = Module['printErr'];
        if (!error.buffer) error.buffer = [];
        // Create the I/O devices.
        var stdin = FS.createDevice('/dev', 'stdin', input);
        stdin.isTerminal = !stdinOverridden;
        var stdout = FS.createDevice('/dev', 'stdout', null, output);
        stdout.isTerminal = !stdoutOverridden;
        var stderr = FS.createDevice('/dev', 'stderr', null, error);
        stderr.isTerminal = !stderrOverridden;
        FS.createDevice('/dev', 'tty', input, output);
        FS.createDevice('/dev', 'null', function(){}, function(){});
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          error: false,
          eof: false,
          ungotten: []
        };
        // TODO: put these low in memory like we used to assert on: assert(Math.max(_stdin, _stdout, _stderr) < 15000); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_NORMAL) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  Module["FS"] = FS;function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      if (FS.streams[stream]) {
        stream = FS.streams[stream];
        if (stream.object.isDevice) {
          ___setErrNo(ERRNO_CODES.ESPIPE);
          return -1;
        } else {
          return stream.position;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      // We use file descriptor numbers and FILE* streams interchangeably.
      return stream;
    }
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      if (FS.streams[fildes] && !FS.streams[fildes].object.isDevice) {
        var stream = FS.streams[fildes];
        var position = offset;
        if (whence === 1) {  // SEEK_CUR.
          position += stream.position;
        } else if (whence === 2) {  // SEEK_END.
          position += stream.object.contents.length;
        }
        if (position < 0) {
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        } else {
          stream.ungotten = [];
          stream.position = position;
          return position;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      } else {
        FS.streams[stream].eof = false;
        return 0;
      }
    }
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      var flush = function(filedes) {
        // Right now we write all data directly, except for output devices.
        if (FS.streams[filedes] && FS.streams[filedes].object.output) {
          if (!FS.streams[filedes].object.isTerminal) { // don't flush terminals, it would cause a \n to also appear
            FS.streams[filedes].object.output(null);
          }
        }
      };
      try {
        if (stream === 0) {
          for (var i = 0; i < FS.streams.length; i++) if (FS.streams[i]) flush(i);
        } else {
          flush(stream);
        }
        return 0;
      } catch (e) {
        ___setErrNo(ERRNO_CODES.EIO);
        return -1;
      }
    }
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }
  var ___dirent_struct_layout={__size__:1040,d_ino:0,d_name:4,d_off:1028,d_reclen:1032,d_type:1036};function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      // NOTE: This implementation tries to mimic glibc rather than strictly
      // following the POSIX standard.
      var mode = HEAP32[((varargs)>>2)];
      // Simplify flags.
      var accessMode = oflag & 3;
      var isWrite = accessMode != 0;
      var isRead = accessMode != 1;
      var isCreate = Boolean(oflag & 512);
      var isExistCheck = Boolean(oflag & 2048);
      var isTruncate = Boolean(oflag & 1024);
      var isAppend = Boolean(oflag & 8);
      // Verify path.
      var origPath = path;
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists) {
        ___setErrNo(path.error);
        return -1;
      }
      var target = path.object || null;
      var finalPath;
      // Verify the file exists, create if needed and allowed.
      if (target) {
        if (isCreate && isExistCheck) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          return -1;
        }
        if ((isWrite || isTruncate) && target.isFolder) {
          ___setErrNo(ERRNO_CODES.EISDIR);
          return -1;
        }
        if (isRead && !target.read || isWrite && !target.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        if (isTruncate && !target.isDevice) {
          target.contents = [];
        } else {
          if (!FS.forceLoadFile(target)) {
            ___setErrNo(ERRNO_CODES.EIO);
            return -1;
          }
        }
        finalPath = path.path;
      } else {
        if (!isCreate) {
          ___setErrNo(ERRNO_CODES.ENOENT);
          return -1;
        }
        if (!path.parentObject.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        target = FS.createDataFile(path.parentObject, path.name, [],
                                   mode & 0x100, mode & 0x80);  // S_IRUSR, S_IWUSR.
        finalPath = path.parentPath + '/' + path.name;
      }
      // Actually create an open stream.
      var id;
      if (target.isFolder) {
        var entryBuffer = 0;
        if (___dirent_struct_layout) {
          entryBuffer = _malloc(___dirent_struct_layout.__size__);
        }
        var contents = [];
        for (var key in target.contents) contents.push(key);
        id = FS.createFileHandle({
          path: finalPath,
          object: target,
          // An index into contents. Special values: -2 is ".", -1 is "..".
          position: -2,
          isRead: true,
          isWrite: false,
          isAppend: false,
          error: false,
          eof: false,
          ungotten: [],
          // Folder-specific properties:
          // Remember the contents at the time of opening in an array, so we can
          // seek between them relying on a single order.
          contents: contents,
          // Each stream has its own area for readdir() returns.
          currentEntry: entryBuffer
        });
      } else {
        id = FS.createFileHandle({
          path: finalPath,
          object: target,
          position: 0,
          isRead: isRead,
          isWrite: isWrite,
          isAppend: isAppend,
          error: false,
          eof: false,
          ungotten: []
        });
      }
      return id;
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 1024;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 8;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      return Number(FS.streams[stream] && FS.streams[stream].eof);
    }
  function _recv(fd, buf, len, flags) {
      var info = FS.streams[fd];
      if (!info) return -1;
      if (!info.hasData()) {
        ___setErrNo(ERRNO_CODES.EAGAIN); // no data, and all sockets are nonblocking, so this is the right behavior
        return -1;
      }
      var buffer = info.inQueue.shift();
      if (len < buffer.length) {
        if (info.stream) {
          // This is tcp (reliable), so if not all was read, keep it
          info.inQueue.unshift(buffer.subarray(len));
        }
        buffer = buffer.subarray(0, len);
      }
      HEAPU8.set(buffer, buf);
      return buffer.length;
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else if (offset >= stream.object.contents.length) {
        return 0;
      } else {
        var bytesRead = 0;
        var contents = stream.object.contents;
        var size = Math.min(contents.length - offset, nbyte);
        assert(size >= 0);
        if (contents.subarray) { // typed array
          HEAPU8.set(contents.subarray(offset, offset+size), buf);
        } else
        if (contents.slice) { // normal array
          for (var i = 0; i < size; i++) {
            HEAP8[(((buf)+(i))|0)]=contents[offset + i]
          }
        } else {
          for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
            HEAP8[(((buf)+(i))|0)]=contents.get(offset + i)
          }
        }
        bytesRead += size;
        return bytesRead;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (stream && ('socket' in stream)) {
        return _recv(fildes, buf, nbyte, 0);
      } else if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead;
        if (stream.object.isDevice) {
          if (stream.object.input) {
            bytesRead = 0;
            for (var i = 0; i < nbyte; i++) {
              try {
                var result = stream.object.input();
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
              if (result === undefined && bytesRead === 0) {
                ___setErrNo(ERRNO_CODES.EAGAIN);
                return -1;
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              HEAP8[(((buf)+(i))|0)]=result
            }
            return bytesRead;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          bytesRead = _pread(fildes, buf, nbyte, stream.position);
          assert(bytesRead >= -1);
          if (bytesRead != -1) {
            stream.position += bytesRead;
          }
          return bytesRead;
        }
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.streams[stream];
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop()
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(stream, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      if (!FS.streams[stream]) return -1;
      var streamObj = FS.streams[stream];
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        streamObj.eof = true;
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      if (FS.streams[fildes]) {
        if (FS.streams[fildes].currentEntry) {
          _free(FS.streams[fildes].currentEntry);
        }
        FS.streams[fildes] = null;
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      if (FS.streams[fildes]) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;
  var _llvm_memset_p0i8_i64=_memset;
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _memmove(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      if (((src|0) < (dest|0)) & ((dest|0) < ((src + num)|0))) {
        // Unlikely case: Copy backwards in a safe manner
        src = (src + num)|0;
        dest = (dest + num)|0;
        while ((num|0) > 0) {
          dest = (dest - 1)|0;
          src = (src - 1)|0;
          num = (num - 1)|0;
          HEAP8[(dest)]=HEAP8[(src)];
        }
      } else {
        _memcpy(dest, src, num) | 0;
      }
    }var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  function _llvm_uadd_with_overflow_i32(x, y) {
      x = x>>>0;
      y = y>>>0;
      return tempRet0 = x+y > 4294967295,(x+y)>>>0;
    }
  function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      (_memcpy(newStr, ptr, len)|0);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }
  function _send(fd, buf, len, flags) {
      var info = FS.streams[fd];
      if (!info) return -1;
      info.sender(HEAPU8.subarray(buf, buf+len));
      return len;
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (stream && ('socket' in stream)) {
          return _send(fildes, buf, nbyte, 0);
      } else if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }
  function _strcpy(pdest, psrc) {
      pdest = pdest|0; psrc = psrc|0;
      var i = 0;
      do {
        HEAP8[(((pdest+i)|0)|0)]=HEAP8[(((psrc+i)|0)|0)];
        i = (i+1)|0;
      } while (HEAP8[(((psrc)+(i-1))|0)]);
      return pdest|0;
    }
  function _strncpy(pdest, psrc, num) {
      pdest = pdest|0; psrc = psrc|0; num = num|0;
      var padding = 0, curr = 0, i = 0;
      while ((i|0) < (num|0)) {
        curr = padding ? 0 : HEAP8[(((psrc)+(i))|0)];
        HEAP8[(((pdest)+(i))|0)]=curr
        padding = padding ? 1 : (HEAP8[(((psrc)+(i))|0)] == 0);
        i = (i+1)|0;
      }
      return pdest|0;
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  function _tolower(chr) {
      chr = chr|0;
      if ((chr|0) < 65) return chr|0;
      if ((chr|0) > 90) return chr|0;
      return (chr - 65 + 97)|0;
    }function _strncasecmp(px, py, n) {
      px = px|0; py = py|0; n = n|0;
      var i = 0, x = 0, y = 0;
      while ((i>>>0) < (n>>>0)) {
        x = _tolower(HEAP8[(((px)+(i))|0)])|0;
        y = _tolower(HEAP8[(((py)+(i))|0)])|0;
        if (((x|0) == (y|0)) & ((x|0) == 0)) return 0;
        if ((x|0) == 0) return -1;
        if ((y|0) == 0) return 1;
        if ((x|0) == (y|0)) {
          i = (i + 1)|0;
          continue;
        } else {
          return ((x>>>0) > (y>>>0) ? 1 : -1)|0;
        }
      }
      return 0;
    }function _strcasecmp(px, py) {
      px = px|0; py = py|0;
      return _strncasecmp(px, py, -1)|0;
    }
  function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _abort() {
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }var ___errno=___errno_location;
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x = event.pageX - (window.scrollX + rect.left);
          var y = event.pageY - (window.scrollY + rect.top);
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 52428800;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var FUNCTION_TABLE = [0, 0];
// EMSCRIPTEN_START_FUNCS
function _get_item_from_archive_list(r1){return r1|0}function _get_next_from_archive_list(r1){return HEAP32[r1+36>>2]}function _get_name_from_archive_entry(r1){return HEAP32[r1>>2]}function _get_pack_size_from_archive_entry(r1){return HEAP32[r1+8>>2]}function _get_unp_size_from_archive_entry(r1){return HEAP32[r1+12>>2]}function _get_host_os_from_archive_entry(r1){return HEAP8[r1+16|0]}function _get_file_time_from_archive_entry(r1){return HEAP32[r1+24>>2]}function _get_file_attr_from_archive_entry(r1){return HEAP32[r1+32>>2]}function _UnpackXX_fileoutput(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12;r7=_ftell(r3);if((r1|0)==0){r8=0;return r8}r9=HEAP32[1038];if((r9|0)==0){r10=_malloc(4266976);HEAP32[1038]=r10;_ppm_constructor(r10+4229904|0);r11=HEAP32[1038]}else{r11=r9}HEAP32[r11+4249556>>2]=0;HEAP32[HEAP32[1038]+4249524>>2]=0;HEAP32[HEAP32[1038]+4249516>>2]=0;HEAP32[HEAP32[1038]+4249508>>2]=0;HEAP32[HEAP32[1038]+4249520>>2]=0;HEAP32[HEAP32[1038]+4249512>>2]=0;HEAP32[HEAP32[1038]+4249596>>2]=-1;r11=HEAP32[1038];r9=r11+4249544|0;HEAP32[r9>>2]=r4;HEAP32[r9+4>>2]=(r4|0)<0?-1:0;HEAP32[r11+4249552>>2]=r5;r11=_fileno(r1);HEAP32[HEAP32[1038]>>2]=r11;r11=_fileno(r3);_lseek(r11,r7,0);if((r2|0)==29){r12=_rar_unpack29(r11,r6&16,HEAP32[1038])}else if((r2|0)==15){r12=_rar_unpack15(r11,r6&16,HEAP32[1038])}else if((r2|0)==20|(r2|0)==26){r12=_rar_unpack20(r11,r6&16,HEAP32[1038])}else{r12=0}_fseek(r3,r7+r5|0,0);_fflush(r1);r8=r12;return r8}function _Unpack29(r1,r2,r3,r4){var r5,r6,r7;r5=STACKTOP;STACKTOP=STACKTOP+104|0;r6=r5|0;_snprintf(r6,99,1936,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1040],tempInt));HEAP32[1040]=HEAP32[1040]+1;r7=_fopen(r6,1928);if((r7|0)==0){STACKTOP=r5;return}_UnpackXX_fileoutput(r7,29,r1,r2,r3,r4);L25:do{if((HEAP32[644]|0)!=0){_fseek(r7,0,0);if((_feof(r7)|0)!=0){break}while(1){if(HEAP32[HEAP32[642]>>2]>>>0>r2>>>0){break L25}r4=_fgetc(r7);if((r4|0)==-1){break L25}HEAP8[HEAP32[644]+HEAP32[HEAP32[642]>>2]|0]=r4&255;r4=HEAP32[642];HEAP32[r4>>2]=HEAP32[r4>>2]+1;if((_feof(r7)|0)!=0){break}}}}while(0);_fclose(r7);STACKTOP=r5;return}function _rar_unpack15(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42;r4=r3>>2;r5=0;_unpack_init_data(r2,r3);r6=(r2|0)==0;if(r6){r2=(r3+4255660|0)>>2;HEAP32[r2]=0;HEAP32[r2+1]=0;HEAP32[r2+2]=0;HEAP32[r2+3]=0;HEAP32[r2+4]=0;HEAP32[r2+5]=0;HEAP32[r4+1063914]=13568;HEAP32[r4+1063926]=8193;HEAP32[r4+1063925]=128;HEAP32[r4+1063924]=128}r2=(r3+4255692|0)>>2;HEAP32[r2]=0;r7=(r3+4255652|0)>>2;HEAP32[r7]=0;r8=r3+4255684|0;HEAP32[r8>>2]=0;r9=(r3+4255688|0)>>2;HEAP32[r9]=0;r10=r3+4227096|0;HEAP32[r10>>2]=0;if((_unp_read_buf(r1,r3)|0)==0){r11=0;return r11}if(r6){r6=0;while(1){HEAP32[((r6<<2)+4261852>>2)+r4]=r6;HEAP32[((r6<<2)+4260828>>2)+r4]=r6;HEAP32[((r6<<2)+4259804>>2)+r4]=r6;r12=-r6&255;HEAP32[((r6<<2)+4262876>>2)+r4]=r12;r13=r6<<8;HEAP32[((r6<<2)+4257756>>2)+r4]=r13;HEAP32[((r6<<2)+4255708>>2)+r4]=r13;HEAP32[((r6<<2)+4256732>>2)+r4]=r6;HEAP32[((r6<<2)+4258780>>2)+r4]=r12<<8;r12=r6+1|0;if(r12>>>0<256){r6=r12}else{break}}_memset(r3+4263900|0,0,3072);_corr_huff(r3+4257756|0,r3+4264924|0);HEAP32[r4+1056771]=0}else{HEAP32[r4+1056771]=HEAP32[r4+1056772]}r6=(r3+4249544|0)>>2;r12=HEAP32[r6];r13=HEAP32[r6+1];r14=_i64Add(r12,r13,-1,-1);r15=tempRet0;HEAP32[r6]=r14;HEAP32[r6+1]=r15;r16=0;if((r13|0)>(r16|0)|(r13|0)==(r16|0)&r12>>>0>0>>>0){_get_flag_buf(r3);HEAP32[r2]=8;r5=39}else{r17=r15;r18=r14}L48:while(1){if(r5==39){r5=0;r17=HEAP32[r6+1];r18=HEAP32[r6]}r14=-1;if(!((r17|0)>(r14|0)|(r17|0)==(r14|0)&r18>>>0>-1>>>0)){break}r14=(r3+4227084|0)>>2;r15=HEAP32[r14]&4194303;HEAP32[r14]=r15;if((HEAP32[r4+1056769]|0)>(HEAP32[r10>>2]-30|0)){if((_unp_read_buf(r1,r3)|0)==0){break}r19=HEAP32[r14]}else{r19=r15}r15=HEAP32[r4+1056772];if(!((r15-r19&4194302)>>>0>269|(r15|0)==(r19|0))){_unp_write_buf_old(r3)}if((HEAP32[r8>>2]|0)!=0){_huff_decode(r3);r5=39;continue}r15=HEAP32[r2];r12=r15-1|0;HEAP32[r2]=r12;if((r15|0)<1){_get_flag_buf(r3);HEAP32[r2]=7;r20=7}else{r20=r12}r12=HEAP32[r7];r15=r12<<1;HEAP32[r7]=r15;if((r12&128|0)!=0){if(HEAP32[r4+1063925]>>>0>HEAP32[r4+1063924]>>>0){_long_lz(r3);r5=39;continue}else{_huff_decode(r3);r5=39;continue}}HEAP32[r2]=r20-1;if((r20|0)<1){_get_flag_buf(r3);HEAP32[r2]=7;r21=HEAP32[r7]}else{r21=r15}HEAP32[r7]=r21<<1;if((r21&128|0)!=0){if(HEAP32[r4+1063925]>>>0>HEAP32[r4+1063924]>>>0){_huff_decode(r3);r5=39;continue}else{_long_lz(r3);r5=39;continue}}HEAP32[r4+1063920]=0;r15=_getbits(r3);do{if((HEAP32[r9]|0)==2){_addbits(r3,1);if(r15>>>0<=32767){HEAP32[r9]=0;r22=r15<<1;break}r12=HEAP32[r4+1057474];r16=HEAP32[r4+1057475];HEAP32[r6]=_i64Subtract(HEAP32[r6],HEAP32[r6+1],r16,0);HEAP32[r6+1]=tempRet0;if((r16|0)==0){r5=39;continue L48}r13=r16;r16=HEAP32[r14];while(1){r23=r13-1|0;HEAP8[r3+(r16+32772)|0]=HEAP8[(r16-r12&4194303)+r3+32772|0];r24=HEAP32[r14]+1&4194303;HEAP32[r14]=r24;if((r23|0)==0){r5=39;continue L48}else{r13=r23;r16=r24}}}else{r22=r15}}while(0);r15=r22>>>8;r16=(r3+4255676|0)>>2;r13=HEAP32[r16]+3|0;HEAP32[47]=r13;HEAP32[61]=r13;r13=(r3+4255664|0)>>2;if(HEAP32[r13]>>>0<37){r12=0;while(1){r25=HEAP32[(r12<<2)+240>>2];if(((HEAP32[(r12<<2)+112>>2]^r15)&~(255>>>(r25>>>0))|0)==0){break}else{r12=r12+1|0}}_addbits(r3,r25);r26=r12}else{r24=0;while(1){r27=HEAP32[(r24<<2)+176>>2];if(((HEAP32[(r24<<2)+48>>2]^r15)&~(255>>>(r27>>>0))|0)==0){break}else{r24=r24+1|0}}_addbits(r3,r27);r26=r24}if(r26>>>0<=8){HEAP32[r9]=0;r15=HEAP32[r13]+r26|0;HEAP32[r13]=r15-(r15>>>4);r15=_getbits(r3)&65520;do{if(HEAP32[416]>>>0>r15>>>0){_addbits(r3,5);r28=0;r29=5}else{r12=5;r23=0;while(1){r30=r12+1|0;r31=r23+1|0;if(HEAP32[(r31<<2)+1664>>2]>>>0>r15>>>0){break}else{r12=r30;r23=r31}}_addbits(r3,r30);if((r31|0)==0){r28=0;r29=r30;break}r28=HEAP32[(r23<<2)+1664>>2];r29=r30}}while(0);r13=((r15-r28|0)>>>((16-r29|0)>>>0))+HEAP32[(r29<<2)+1248>>2]&255;r24=(r13<<2)+r3+4256732|0;r12=HEAP32[r24>>2];if((r13|0)!=0){r32=(r12<<2)+r3+4260828|0;HEAP32[r32>>2]=HEAP32[r32>>2]-1;r32=(r13-1<<2)+r3+4256732|0;r13=HEAP32[r32>>2];r33=(r13<<2)+r3+4260828|0;HEAP32[r33>>2]=HEAP32[r33>>2]+1;HEAP32[r24>>2]=r13;HEAP32[r32>>2]=r12}r32=r26+2|0;r13=r12+1|0;r12=(r3+4229892|0)>>2;r24=HEAP32[r12];HEAP32[r12]=r24+1;HEAP32[((r24<<2)+4229876>>2)+r4]=r13;HEAP32[r12]=HEAP32[r12]&3;HEAP32[r4+1057475]=r32;HEAP32[r4+1057474]=r13;HEAP32[r6]=_i64Subtract(HEAP32[r6],HEAP32[r6+1],r32,0);HEAP32[r6+1]=tempRet0;if((r32|0)==0){r5=39;continue}r12=r32;r32=HEAP32[r14];while(1){r24=r12-1|0;HEAP8[r3+(r32+32772)|0]=HEAP8[(r32-r13&4194303)+r3+32772|0];r33=HEAP32[r14]+1&4194303;HEAP32[r14]=r33;if((r24|0)==0){r5=39;continue L48}else{r12=r24;r32=r33}}}if((r26|0)==9){HEAP32[r9]=HEAP32[r9]+1;r32=HEAP32[r4+1057474];r12=HEAP32[r4+1057475];HEAP32[r6]=_i64Subtract(HEAP32[r6],HEAP32[r6+1],r12,0);HEAP32[r6+1]=tempRet0;if((r12|0)==0){r5=39;continue}r13=r12;r12=HEAP32[r14];while(1){r15=r13-1|0;HEAP8[r3+(r12+32772)|0]=HEAP8[(r12-r32&4194303)+r3+32772|0];r33=HEAP32[r14]+1&4194303;HEAP32[r14]=r33;if((r15|0)==0){r5=39;continue L48}else{r13=r15;r12=r33}}}HEAP32[r9]=0;if((r26|0)==14){r12=_getbits(r3)&65520;do{if(HEAP32[380]>>>0>r12>>>0){_addbits(r3,3);r34=0;r35=3}else{r13=3;r32=0;while(1){r36=r13+1|0;r37=r32+1|0;if(HEAP32[(r37<<2)+1520>>2]>>>0>r12>>>0){break}else{r13=r36;r32=r37}}_addbits(r3,r36);if((r37|0)==0){r34=0;r35=r36;break}r34=HEAP32[(r32<<2)+1520>>2];r35=r36}}while(0);r13=HEAP32[(r35<<2)+1024>>2]+((r12-r34|0)>>>((16-r35|0)>>>0))+5|0;r23=_getbits(r3)>>>1|32768;_addbits(r3,15);HEAP32[r4+1057475]=r13;HEAP32[r4+1057474]=r23;HEAP32[r6]=_i64Subtract(HEAP32[r6],HEAP32[r6+1],r13,0);HEAP32[r6+1]=tempRet0;if((r13|0)==0){r5=39;continue}r33=r13;r13=HEAP32[r14];while(1){r15=r33-1|0;HEAP8[r3+(r13+32772)|0]=HEAP8[(r13-r23&4194303)+r3+32772|0];r24=HEAP32[r14]+1&4194303;HEAP32[r14]=r24;if((r15|0)==0){r5=39;continue L48}else{r33=r15;r13=r24}}}r13=(r3+4229892|0)>>2;r33=HEAP32[(((-3-r26+HEAP32[r13]&3)<<2)+4229876>>2)+r4];r23=_getbits(r3)&65520;do{if(HEAP32[390]>>>0>r23>>>0){_addbits(r3,2);r38=0;r39=2}else{r12=2;r24=0;while(1){r40=r12+1|0;r41=r24+1|0;if(HEAP32[(r41<<2)+1560>>2]>>>0>r23>>>0){break}else{r12=r40;r24=r41}}_addbits(r3,r40);if((r41|0)==0){r38=0;r39=r40;break}r38=HEAP32[(r24<<2)+1560>>2];r39=r40}}while(0);r12=((r23-r38|0)>>>((16-r39|0)>>>0))+HEAP32[(r39<<2)+1080>>2]|0;r32=r12+2|0;if((r32|0)==257&(r26|0)==10){HEAP32[r16]=HEAP32[r16]^1;r5=39;continue}r15=(r33>>>0>=HEAP32[r4+1063926]>>>0)+(r33>>>0>256?r12+3|0:r32)|0;r32=HEAP32[r13];HEAP32[r13]=r32+1;HEAP32[((r32<<2)+4229876>>2)+r4]=r33;HEAP32[r13]=HEAP32[r13]&3;HEAP32[r4+1057475]=r15;HEAP32[r4+1057474]=r33;HEAP32[r6]=_i64Subtract(HEAP32[r6],HEAP32[r6+1],r15,0);HEAP32[r6+1]=tempRet0;if((r15|0)==0){r5=39;continue}r32=r15;r15=HEAP32[r14];while(1){r12=r32-1|0;HEAP8[r3+(r15+32772)|0]=HEAP8[(r15-r33&4194303)+r3+32772|0];r42=HEAP32[r14]+1&4194303;HEAP32[r14]=r42;if((r12|0)==0){r5=39;continue L48}else{r32=r12;r15=r42}}}_unp_write_buf_old(r3);r11=1;return r11}function _get_flag_buf(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=((_decode_num(r1,_getbits(r1),5,1664,1248)<<2)+r1+4258780|0)>>2;r3=HEAP32[r2];r4=r1+4255652|0;HEAP32[r4>>2]=r3>>>8;r5=r3+1|0;r6=((r3&255)<<2)+r1+4265948|0;r3=HEAP32[r6>>2];HEAP32[r6>>2]=r3+1;if((r5&255|0)!=0){r7=r5;r8=r3;r9=(r8<<2)+r1+4258780|0,r10=r9>>2;r11=HEAP32[r10];HEAP32[r2]=r11;HEAP32[r10]=r7;return}r3=r1+4258780|0;r5=r1+4265948|0;while(1){_corr_huff(r3,r5);r6=HEAP32[r2];HEAP32[r4>>2]=r6>>>8;r12=r6+1|0;r13=((r6&255)<<2)+r1+4265948|0;r6=HEAP32[r13>>2];HEAP32[r13>>2]=r6+1;if((r12&255|0)!=0){r7=r12;r8=r6;break}}r9=(r8<<2)+r1+4258780|0,r10=r9>>2;r11=HEAP32[r10];HEAP32[r2]=r11;HEAP32[r10]=r7;return}function _huff_decode(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37;r2=_getbits(r1);r3=(r1+4255656|0)>>2;r4=HEAP32[r3];do{if(r4>>>0>30207){r5=r2&65520;do{if(HEAP32[402]>>>0>r5>>>0){_addbits(r1,8);r6=0;r7=8}else{r8=8;r9=0;while(1){r10=r8+1|0;r11=r9+1|0;if(HEAP32[(r11<<2)+1608>>2]>>>0>r5>>>0){break}else{r8=r10;r9=r11}}_addbits(r1,r10);if((r11|0)==0){r6=0;r7=r10;break}r6=HEAP32[(r9<<2)+1608>>2];r7=r10}}while(0);r12=((r5-r6|0)>>>((16-r7|0)>>>0))+HEAP32[(r7<<2)+1136>>2]|0}else{if(r4>>>0>24063){r8=r2&65520;do{if(HEAP32[408]>>>0>r8>>>0){_addbits(r1,6);r13=0;r14=6}else{r15=6;r16=0;while(1){r17=r15+1|0;r18=r16+1|0;if(HEAP32[(r18<<2)+1632>>2]>>>0>r8>>>0){break}else{r15=r17;r16=r18}}_addbits(r1,r17);if((r18|0)==0){r13=0;r14=r17;break}r13=HEAP32[(r16<<2)+1632>>2];r14=r17}}while(0);r12=((r8-r13|0)>>>((16-r14|0)>>>0))+HEAP32[(r14<<2)+1192>>2]|0;break}if(r4>>>0>13823){r5=r2&65520;do{if(HEAP32[416]>>>0>r5>>>0){_addbits(r1,5);r19=0;r20=5}else{r15=5;r9=0;while(1){r21=r15+1|0;r22=r9+1|0;if(HEAP32[(r22<<2)+1664>>2]>>>0>r5>>>0){break}else{r15=r21;r9=r22}}_addbits(r1,r21);if((r22|0)==0){r19=0;r20=r21;break}r19=HEAP32[(r9<<2)+1664>>2];r20=r21}}while(0);r12=((r5-r19|0)>>>((16-r20|0)>>>0))+HEAP32[(r20<<2)+1248>>2]|0;break}r8=r2&65520;if(r4>>>0>3583){do{if(HEAP32[424]>>>0>r8>>>0){_addbits(r1,5);r23=0;r24=5}else{r15=5;r16=0;while(1){r25=r15+1|0;r26=r16+1|0;if(HEAP32[(r26<<2)+1696>>2]>>>0>r8>>>0){break}else{r15=r25;r16=r26}}_addbits(r1,r25);if((r26|0)==0){r23=0;r24=r25;break}r23=HEAP32[(r16<<2)+1696>>2];r24=r25}}while(0);r12=((r8-r23|0)>>>((16-r24|0)>>>0))+HEAP32[(r24<<2)+1304>>2]|0;break}else{do{if(HEAP32[432]>>>0>r8>>>0){_addbits(r1,4);r27=0;r28=4}else{r5=4;r15=0;while(1){r29=r5+1|0;r30=r15+1|0;if(HEAP32[(r30<<2)+1728>>2]>>>0>r8>>>0){break}else{r5=r29;r15=r30}}_addbits(r1,r29);if((r30|0)==0){r27=0;r28=r29;break}r27=HEAP32[(r15<<2)+1728>>2];r28=r29}}while(0);r12=((r8-r27|0)>>>((16-r28|0)>>>0))+HEAP32[(r28<<2)+1360>>2]|0;break}}}while(0);r28=r12&255;r12=(r1+4255684|0)>>2;do{if((HEAP32[r12]|0)==0){r27=r1+4255680|0;r29=HEAP32[r27>>2];HEAP32[r27>>2]=r29+1;if((r29|0)<=15){r31=r28;break}if((HEAP32[r1+4255692>>2]|0)!=0){r31=r28;break}HEAP32[r12]=1;r31=r28}else{r29=(r28|0)==0&r2>>>0>4095?256:r28;if((r29|0)!=0){r31=r29-1|0;break}r29=_getbits(r1);_addbits(r1,1);if((r29&32768|0)!=0){HEAP32[r12]=0;HEAP32[r1+4255680>>2]=0;return}r27=(r29>>>14&1)+3|0;_addbits(r1,1);r29=_getbits(r1)&65520;do{if(HEAP32[416]>>>0>r29>>>0){_addbits(r1,5);r32=0;r33=5}else{r30=5;r24=0;while(1){r34=r30+1|0;r35=r24+1|0;if(HEAP32[(r35<<2)+1664>>2]>>>0>r29>>>0){break}else{r30=r34;r24=r35}}_addbits(r1,r34);if((r35|0)==0){r32=0;r33=r34;break}r32=HEAP32[(r24<<2)+1664>>2];r33=r34}}while(0);r8=((r29-r32|0)>>>((16-r33|0)>>>0))+HEAP32[(r33<<2)+1248>>2]<<5|_getbits(r1)>>>11;_addbits(r1,5);r30=(r1+4249544|0)>>2;HEAP32[r30]=_i64Subtract(HEAP32[r30],HEAP32[r30+1],r27,0);HEAP32[r30+1]=tempRet0;r30=(r1+4227084|0)>>2;r15=r27;r23=HEAP32[r30];while(1){r25=r15-1|0;HEAP8[r1+(r23+32772)|0]=HEAP8[(r23-r8&4194303)+r1+32772|0];r26=HEAP32[r30]+1&4194303;HEAP32[r30]=r26;if((r25|0)==0){break}else{r15=r25;r23=r26}}return}}while(0);r33=HEAP32[r3]+r31|0;HEAP32[r3]=r33-(r33>>>8);r33=(r1+4255696|0)>>2;r3=HEAP32[r33]+16|0;HEAP32[r33]=r3;if(r3>>>0>255){HEAP32[r33]=144;r33=r1+4255700|0;HEAP32[r33>>2]=HEAP32[r33>>2]>>>1}r33=((r31<<2)+r1+4255708|0)>>2;r31=HEAP32[r33]>>>8&255;r3=r1+4227084|0;r32=HEAP32[r3>>2];HEAP32[r3>>2]=r32+1;HEAP8[r1+(r32+32772)|0]=r31;r31=(r1+4249544|0)>>2;HEAP32[r31]=_i64Add(HEAP32[r31],HEAP32[r31+1],-1,-1);HEAP32[r31+1]=tempRet0;r31=HEAP32[r33];r32=r31+1|0;r3=((r31&255)<<2)+r1+4263900|0;r31=HEAP32[r3>>2];HEAP32[r3>>2]=r31+1;if((r32&254)>>>0>161){r3=r1+4255708|0;r34=r1+4263900|0;while(1){_corr_huff(r3,r34);r35=HEAP32[r33];r12=r35+1|0;r28=((r35&255)<<2)+r1+4263900|0;r35=HEAP32[r28>>2];HEAP32[r28>>2]=r35+1;if((r12&254)>>>0<=161){r36=r12;r37=r35;break}}}else{r36=r32;r37=r31}r31=(r37<<2)+r1+4255708|0;HEAP32[r33]=HEAP32[r31>>2];HEAP32[r31>>2]=r36;return}function _long_lz(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38;r2=r1>>2;r3=0;HEAP32[r2+1063920]=0;r4=(r1+4255700|0)>>2;r5=HEAP32[r4]+16|0;HEAP32[r4]=r5;if(r5>>>0>255){HEAP32[r4]=144;r4=r1+4255696|0;HEAP32[r4>>2]=HEAP32[r4>>2]>>>1}r4=(r1+4255668|0)>>2;r5=HEAP32[r4];r6=_getbits(r1);r7=HEAP32[r4];do{if(r7>>>0>121){r8=r6&65520;do{if(HEAP32[380]>>>0>r8>>>0){_addbits(r1,3);r9=0;r10=3}else{r11=3;r12=0;while(1){r13=r11+1|0;r14=r12+1|0;if(HEAP32[(r14<<2)+1520>>2]>>>0>r8>>>0){break}else{r11=r13;r12=r14}}_addbits(r1,r13);if((r14|0)==0){r9=0;r10=r13;break}r9=HEAP32[(r12<<2)+1520>>2];r10=r13}}while(0);r15=((r8-r9|0)>>>((16-r10|0)>>>0))+HEAP32[(r10<<2)+1024>>2]|0}else{if(r7>>>0<=63){if(r6>>>0<256){_addbits(r1,16);r15=r6;break}else{r16=0}while(1){r17=r16+1|0;if((32768>>>(r16>>>0)&r6|0)==0){r16=r17}else{break}}_addbits(r1,r17);r15=r16;break}r8=r6&65520;do{if(HEAP32[390]>>>0>r8>>>0){_addbits(r1,2);r18=0;r19=2}else{r11=2;r20=0;while(1){r21=r11+1|0;r22=r20+1|0;if(HEAP32[(r22<<2)+1560>>2]>>>0>r8>>>0){break}else{r11=r21;r20=r22}}_addbits(r1,r21);if((r22|0)==0){r18=0;r19=r21;break}r18=HEAP32[(r20<<2)+1560>>2];r19=r21}}while(0);r15=((r8-r18|0)>>>((16-r19|0)>>>0))+HEAP32[(r19<<2)+1080>>2]|0}}while(0);r19=HEAP32[r4]+r15|0;HEAP32[r4]=r19-(r19>>>5);r19=_getbits(r1);r4=(r1+4255660|0)>>2;r18=HEAP32[r4];do{if(r18>>>0>10495){r21=r19&65520;do{if(HEAP32[416]>>>0>r21>>>0){_addbits(r1,5);r23=0;r24=5}else{r22=5;r6=0;while(1){r25=r22+1|0;r26=r6+1|0;if(HEAP32[(r26<<2)+1664>>2]>>>0>r21>>>0){break}else{r22=r25;r6=r26}}_addbits(r1,r25);if((r26|0)==0){r23=0;r24=r25;break}r23=HEAP32[(r6<<2)+1664>>2];r24=r25}}while(0);r27=((r21-r23|0)>>>((16-r24|0)>>>0))+HEAP32[(r24<<2)+1248>>2]|0}else{r8=r19&65520;if(r18>>>0>1791){do{if(HEAP32[424]>>>0>r8>>>0){_addbits(r1,5);r28=0;r29=5}else{r22=5;r20=0;while(1){r30=r22+1|0;r31=r20+1|0;if(HEAP32[(r31<<2)+1696>>2]>>>0>r8>>>0){break}else{r22=r30;r20=r31}}_addbits(r1,r30);if((r31|0)==0){r28=0;r29=r30;break}r28=HEAP32[(r20<<2)+1696>>2];r29=r30}}while(0);r27=((r8-r28|0)>>>((16-r29|0)>>>0))+HEAP32[(r29<<2)+1304>>2]|0;break}else{do{if(HEAP32[432]>>>0>r8>>>0){_addbits(r1,4);r32=0;r33=4}else{r21=4;r22=0;while(1){r34=r21+1|0;r35=r22+1|0;if(HEAP32[(r35<<2)+1728>>2]>>>0>r8>>>0){break}else{r21=r34;r22=r35}}_addbits(r1,r34);if((r35|0)==0){r32=0;r33=r34;break}r32=HEAP32[(r22<<2)+1728>>2];r33=r34}}while(0);r27=((r8-r32|0)>>>((16-r33|0)>>>0))+HEAP32[(r33<<2)+1360>>2]|0;break}}}while(0);r33=HEAP32[r4]+r27|0;HEAP32[r4]=r33-(r33>>>8);r33=((r27&255)<<2)+r1+4257756|0;r4=HEAP32[r33>>2];r32=r4+1|0;r34=((r4&255)<<2)+r1+4264924|0;r4=HEAP32[r34>>2];HEAP32[r34>>2]=r4+1;if((r32&255|0)==0){r34=r1+4257756|0;r35=r1+4264924|0;while(1){_corr_huff(r34,r35);r29=HEAP32[r33>>2];r28=r29+1|0;r30=((r29&255)<<2)+r1+4264924|0;r29=HEAP32[r30>>2];HEAP32[r30>>2]=r29+1;if((r28&255|0)!=0){r36=r28;r37=r29;break}}}else{r36=r32;r37=r4}r4=(r37<<2)+r1+4257756|0;HEAP32[((r27<<2)+4257756>>2)+r2]=HEAP32[r4>>2];HEAP32[r4>>2]=r36;r4=_getbits(r1)>>>8|r36&65280;r36=r4>>>1;_addbits(r1,7);r27=(r1+4255672|0)>>2;r37=HEAP32[r27];do{if((r15|0)==0){if(r36>>>0>HEAP32[r2+1063926]>>>0){r3=219;break}r32=r37+1|0;HEAP32[r27]=r32-(r32>>>8)}else if(!((r15|0)==4|(r15|0)==1)){r3=219}}while(0);do{if(r3==219){if((r37|0)==0){break}HEAP32[r27]=r37-1}}while(0);r27=r1+4255704|0;r3=(r36>>>0<HEAP32[r27>>2]>>>0?3:4)+r15|0;r15=r4>>>0<514?r3+8|0:r3;if(r37>>>0>176){r38=32512}else{r38=HEAP32[r2+1063914]>>>0>10751&r5>>>0<64?32512:8193}HEAP32[r27>>2]=r38;r38=(r1+4229892|0)>>2;r27=HEAP32[r38];HEAP32[r38]=r27+1;HEAP32[((r27<<2)+4229876>>2)+r2]=r36;HEAP32[r38]=HEAP32[r38]&3;HEAP32[r2+1057475]=r15;HEAP32[r2+1057474]=r36;r2=(r1+4249544|0)>>2;HEAP32[r2]=_i64Subtract(HEAP32[r2],HEAP32[r2+1],r15,0);HEAP32[r2+1]=tempRet0;if((r15|0)==0){return}r2=(r1+4227084|0)>>2;r38=r15;r15=HEAP32[r2];while(1){r27=r38-1|0;HEAP8[r1+(r15+32772)|0]=HEAP8[(r15-r36&4194303)+r1+32772|0];r5=HEAP32[r2]+1&4194303;HEAP32[r2]=r5;if((r27|0)==0){break}else{r38=r27;r15=r5}}return}function _decode_num(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11;r6=r2&65520;do{if(HEAP32[r4>>2]>>>0>r6>>>0){_addbits(r1,r3);r7=0;r8=r3}else{r2=r3;r9=0;while(1){r10=r2+1|0;r11=r9+1|0;if(HEAP32[r4+(r11<<2)>>2]>>>0>r6>>>0){break}else{r2=r10;r9=r11}}_addbits(r1,r10);if((r11|0)==0){r7=0;r8=r10;break}r7=HEAP32[r4+(r9<<2)>>2];r8=r10}}while(0);return((r6-r7|0)>>>((16-r8|0)>>>0))+HEAP32[r5+(r8<<2)>>2]|0}function _rar_cmd_array_init(r1){HEAP32[r1>>2]=0;HEAP32[r1+4>>2]=0;return}function _ppm_constructor(r1){HEAP32[r1>>2]=0;HEAP32[r1+568>>2]=0;HEAP32[r1+572>>2]=0;return}function _corr_huff(r1,r2){var r3,r4,r5,r6;r3=r2>>2;r4=r1;r5=0;while(1){HEAP32[r4>>2]=HEAP32[r4>>2]&-256|7;r6=r5+1|0;if((r6|0)<32){r4=r4+4|0;r5=r6}else{break}}r5=r1+128|0;r4=0;while(1){HEAP32[r5>>2]=HEAP32[r5>>2]&-256|6;r6=r4+1|0;if((r6|0)<32){r5=r5+4|0;r4=r6}else{break}}r4=r1+256|0;r5=0;while(1){HEAP32[r4>>2]=HEAP32[r4>>2]&-256|5;r6=r5+1|0;if((r6|0)<32){r4=r4+4|0;r5=r6}else{break}}r5=r1+384|0;r4=0;while(1){HEAP32[r5>>2]=HEAP32[r5>>2]&-256|4;r6=r4+1|0;if((r6|0)<32){r5=r5+4|0;r4=r6}else{break}}r4=r1+512|0;r5=0;while(1){HEAP32[r4>>2]=HEAP32[r4>>2]&-256|3;r6=r5+1|0;if((r6|0)<32){r4=r4+4|0;r5=r6}else{break}}r5=r1+640|0;r4=0;while(1){HEAP32[r5>>2]=HEAP32[r5>>2]&-256|2;r6=r4+1|0;if((r6|0)<32){r5=r5+4|0;r4=r6}else{break}}r4=r1+768|0;r5=0;while(1){HEAP32[r4>>2]=HEAP32[r4>>2]&-256|1;r6=r5+1|0;if((r6|0)<32){r4=r4+4|0;r5=r6}else{break}}r5=r1+896|0;r1=0;while(1){HEAP32[r5>>2]=HEAP32[r5>>2]&-256;r4=r1+1|0;if((r4|0)<32){r5=r5+4|0;r1=r4}else{break}}_memset(r2,0,1024);HEAP32[r3+6]=32;HEAP32[r3+5]=64;HEAP32[r3+4]=96;HEAP32[r3+3]=128;HEAP32[r3+2]=160;HEAP32[r3+1]=192;HEAP32[r3]=224;return}function _rar_cmd_array_reset(r1){var r2,r3;if((r1|0)==0){return}r2=r1|0;r3=HEAP32[r2>>2];if((r3|0)!=0){_free(r3)}HEAP32[r2>>2]=0;HEAP32[r1+4>>2]=0;return}function _rar_cmd_array_add(r1,r2){var r3,r4,r5;r3=(r1+4|0)>>2;r4=HEAP32[r3]+r2|0;HEAP32[r3]=r4;r2=r1|0;r1=_realloc(HEAP32[r2>>2],r4*40&-1);r4=r1;HEAP32[r2>>2]=r4;if((r1|0)==0){r5=0;return r5}_memset(r4+((HEAP32[r3]-1)*40&-1)|0,0,40);r5=1;return r5}function _ppm_decode_init(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r5=r1>>2;r6=_rar_get_char(r2,r3);r7=(r6&32|0)!=0;do{if(r7){r8=(_rar_get_char(r2,r3)<<20)+1048576|0}else{if((HEAP32[r5]|0)==0){r9=0}else{r8=0;break}return r9}}while(0);if((r6&64|0)!=0){HEAP32[r4>>2]=_rar_get_char(r2,r3)}r4=(r1+524|0)>>2;HEAP32[r4]=0;HEAP32[r5+130]=0;HEAP32[r5+132]=-1;r10=_rar_get_char(r2,r3);HEAP32[r4]=r10;r11=r10<<8|_rar_get_char(r2,r3);HEAP32[r4]=r11;r10=r11<<8|_rar_get_char(r2,r3);HEAP32[r4]=r10;HEAP32[r4]=r10<<8|_rar_get_char(r2,r3);if(r7){r7=r6&31;r6=r7+1|0;if(r6>>>0>16){r12=(r7*3&-1)-29|0}else{r12=r6}r6=(r1|0)>>2;r7=HEAP32[r6];if((r12|0)==1){if((r7|0)==0){r9=0;return r9}HEAP32[r6]=0;_free(HEAP32[r5+85]);r9=0;return r9}do{if((r7|0)!=(r8|0)){if((r7|0)==0){r13=r1+340|0}else{HEAP32[r6]=0;r3=r1+340|0;_free(HEAP32[r3>>2]);r13=r3}r3=((r8>>>0)/12&-1)<<4;r2=_malloc(r3+16|0);HEAP32[r13>>2]=r2;if((r2|0)!=0){HEAP32[r5+128]=r2+r3;HEAP32[r6]=r8;break}if((HEAP32[r6]|0)==0){r9=0;return r9}HEAP32[r6]=0;_free(HEAP32[r5+85]);r9=0;return r9}}while(0);HEAP8[r1+1604|0]=1;HEAP32[r5+139]=r12;if((_restart_model_rare(r1)|0)==0){if((HEAP32[r6]|0)==0){r9=0;return r9}HEAP32[r6]=0;_free(HEAP32[r5+85]);r9=0;return r9}HEAP8[r1+1092|0]=0;HEAP8[r1+1093|0]=2;_memset(r1+1094|0,4,9);_memset(r1+1103|0,6,245);HEAP8[r1+836|0]=0;HEAP8[r1+837|0]=1;HEAP8[r1+838|0]=2;r6=3;r12=1;r8=3;r13=1;while(1){HEAP8[r1+(r6+836)|0]=r8&255;r7=r12-1|0;if((r7|0)==0){r3=r13+1|0;r14=r3;r15=r8+1|0;r16=r3}else{r14=r13;r15=r8;r16=r7}r7=r6+1|0;if((r7|0)<256){r6=r7;r12=r16;r8=r15;r13=r14}else{break}}_memset(r1+1348|0,0,64);_memset(r1+1412|0,8,192);HEAP8[r1+3210|0]=7}r9=(HEAP32[r5+142]|0)!=0|0;return r9}function _ppm_decode_char(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1024|0;r6=r5;r7=(r1+568|0)>>2;r8=HEAP32[r7];r9=r8;r10=(r1+504|0)>>2;r11=HEAP32[r10];if(r9>>>0<=r11>>>0){r12=-1;STACKTOP=r5;return r12}r13=r1+512|0;r14=HEAP32[r13>>2];if(r9>>>0>r14>>>0){r12=-1;STACKTOP=r5;return r12}r9=(r8|0)>>1;do{if((HEAP16[r9]|0)==1){r15=r8+4|0;r16=r15;r17=(r1+576|0)>>2;r18=HEAP8[HEAPU8[HEAP32[r17]|0]+r1+1348|0];HEAP8[r1+1606|0]=r18;r19=r1+1605|0;r20=r15;r15=(r1+560|0)>>2;r21=r16+1|0;r22=((HEAPU8[r21]-1<<7)+((HEAPU8[HEAPU8[r20]+r1+1348|0]<<1)+HEAPU8[r19]+(r18&255)+HEAPU8[HEAPU16[HEAP32[r8+12>>2]>>1]-1+r1+1092|0]+(HEAP32[r15]>>>26&32)<<1)+r1+3212|0)>>1;r18=HEAP32[r1+524>>2]-HEAP32[r1+520>>2]|0;r23=r1+528|0;r24=HEAP32[r23>>2]>>>14;HEAP32[r23>>2]=r24;r23=HEAPU16[r22];if(((r18>>>0)/(r24>>>0)&-1)>>>0<r23>>>0){HEAP32[r17]=r16;r16=HEAP8[r21];HEAP8[r21]=((r16&255)>>>7^1)+r16&255;HEAP32[r1+532>>2]=0;HEAP32[r1+536>>2]=HEAPU16[r22];r16=HEAPU16[r22];HEAP16[r22]=r16+128-((r16+32|0)>>>7)&65535;HEAP8[r19]=1;HEAP32[r15]=HEAP32[r15]+1;break}else{HEAP32[r1+532>>2]=r23;r23=HEAPU16[r22];HEAP16[r22]=r23-((r23+32|0)>>>7)&65535;HEAP32[r1+536>>2]=16384;HEAP32[r1+548>>2]=HEAPU8[(HEAPU16[r22]>>>10)+2552|0];HEAP32[r1+544>>2]=1;HEAP8[HEAPU8[r20]+r1+580|0]=HEAP8[r1+1604|0];HEAP8[r19]=0;HEAP32[r17]=0;break}}else{r17=r8+8|0;r19=HEAP32[r17>>2]|0;if(r19>>>0<=r11>>>0|r19>>>0>r14>>>0){r12=-1;STACKTOP=r5;return r12}r19=(r8+4|0)>>1;r20=HEAPU16[r19];r22=r1+540|0;HEAP32[r22>>2]=r20;r23=HEAP32[r17>>2];r17=HEAP32[r1+524>>2]-HEAP32[r1+520>>2]|0;r15=r1+528|0;r16=(HEAP32[r15>>2]>>>0)/(r20>>>0)&-1;HEAP32[r15>>2]=r16;r15=(r17>>>0)/(r16>>>0)&-1;if(r15>>>0>=r20>>>0){r12=-1;STACKTOP=r5;return r12}r16=r23+1|0;r17=HEAPU8[r16];if((r15|0)<(r17|0)){HEAP32[r1+536>>2]=r17;r21=r17<<1>>>0>r20>>>0;HEAP8[r1+1605|0]=r21&1;r20=r1+560|0;HEAP32[r20>>2]=HEAP32[r20>>2]+(r21&1);r21=r17+4|0;HEAP32[r1+576>>2]=r23;HEAP8[r16]=r21&255;HEAP16[r19]=HEAP16[r19]+4&65535;if(r21>>>0>124){_rescale(r1,r8)}HEAP32[r1+532>>2]=0;break}r21=(r1+576|0)>>2;r16=HEAP32[r21];if((r16|0)==0){r12=-1;STACKTOP=r5;return r12}HEAP8[r1+1605|0]=0;r20=r17;r17=HEAPU16[r9]-1|0;r24=r23;while(1){r25=r24+8|0;r26=r24+9|0;r27=HEAPU8[r26]+r20|0;if((r27|0)>(r15|0)){r4=319;break}r23=r17-1|0;if((r23|0)==0){r4=316;break}else{r20=r27;r17=r23;r24=r25}}if(r4==316){HEAP8[r1+1606|0]=HEAP8[HEAPU8[r16|0]+r1+1348|0];HEAP32[r1+532>>2]=r27;r17=r1+1604|0;HEAP8[HEAPU8[r25|0]+r1+580|0]=HEAP8[r17];r20=HEAPU16[r9];HEAP32[r1+544>>2]=r20;HEAP32[r21]=0;r15=r20-1|0;r20=r25;while(1){r23=r20-8|0;HEAP8[HEAPU8[r23|0]+r1+580|0]=HEAP8[r17];r18=r15-1|0;if((r18|0)==0){break}else{r15=r18;r20=r23}}HEAP32[r1+536>>2]=HEAP32[r22>>2];break}else if(r4==319){HEAP32[r1+536>>2]=r27;HEAP32[r1+532>>2]=r27-HEAPU8[r26];HEAP32[r21]=r25;HEAP8[r26]=HEAP8[r26]+4&255;HEAP16[r19]=HEAP16[r19]+4&65535;r20=r24+1|0;if(HEAPU8[r26]<=HEAPU8[r20]){break}r15=r25>>2;r17=HEAP32[r15];r16=HEAP32[r15+1];r23=r24>>2;r18=HEAP32[r23+1];HEAP32[r15]=HEAP32[r23];HEAP32[r15+1]=r18;HEAP32[r23]=r17;HEAP32[r23+1]=r16;HEAP32[r21]=r24;if(HEAPU8[r20]<=124){break}_rescale(r1,r8);break}}}while(0);r8=(r1+528|0)>>2;r25=HEAP32[r8];r26=(r1+532|0)>>2;r27=HEAP32[r26];r9=(r1+520|0)>>2;r14=(Math.imul(r27,r25)|0)+HEAP32[r9]|0;HEAP32[r9]=r14;r11=(r1+536|0)>>2;r20=Math.imul(HEAP32[r11]-r27|0,r25)|0;HEAP32[r8]=r20;r25=(r1+576|0)>>2;r27=HEAP32[r25];L451:do{if((r27|0)==0){r16=(r1+524|0)>>2;r23=r1+552|0;r17=(r1+544|0)>>2;r18=r1+3208|0;r15=(r1+540|0)>>2;r28=r6|0;r29=r1+1604|0;r30=r1+564|0;r31=r1+560|0;r32=r6-4|0;r33=r1+1606|0;r34=r14;r35=r20;L454:while(1){do{if((r35+r34^r34)>>>0>=16777216){if(r35>>>0<32768){HEAP32[r8]=-r34&32767;break}r36=HEAP32[r10];r37=HEAP32[r23>>2];r38=HEAP32[r7];while(1){r39=r37+1|0;HEAP32[r23>>2]=r39;r40=HEAP32[r38+12>>2];HEAP32[r7]=r40;r41=r40;if(r41>>>0<=r36>>>0){r12=-1;r4=422;break L454}if(r41>>>0>HEAP32[r13>>2]>>>0){r12=-1;r4=415;break L454}r42=(r40|0)>>1;r43=HEAP16[r42];r44=r43&65535;r45=HEAP32[r17];if((r44|0)==(r45|0)){r37=r39;r38=r40}else{break}}r38=r44-r45|0;if(r43<<16>>16==256){r46=r18;r47=1}else{r37=HEAPU8[r38-1+r1+836|0];r36=((HEAPU16[HEAP32[r40+12>>2]>>1]-r44|0)>(r38|0)|((r45|0)>(r38|0))<<2|(HEAPU16[r40+4>>1]>>>0<(r44*11&-1)>>>0)<<1)+HEAPU8[r33]|0;r39=(r37<<6)+(r36<<2)+r1+1608|0;r41=r39|0;r48=HEAPU16[r41>>1];r49=r48>>>(HEAPU8[(r37<<6)+(r36<<2)+r1+1610|0]>>>0);HEAP16[r41>>1]=r48-r49&65535;r46=r39;r47=((r49|0)==0)+r49|0}HEAP32[r15]=r47;r49=HEAP32[r40+8>>2]-8|0;r39=r28;r48=r38;r38=0;while(1){r41=HEAP8[r29];r36=r49;while(1){r50=r36+8|0;if((HEAP8[HEAPU8[r50|0]+r1+580|0]|0)==r41<<24>>24){r36=r50}else{break}}r51=HEAPU8[r36+9|0]+r38|0;HEAP32[r39>>2]=r50;r41=r48-1|0;if((r41|0)==0){break}r49=r50;r39=r39+4|0;r48=r41;r38=r51}r38=HEAP32[r15]+r51|0;HEAP32[r15]=r38;r48=HEAP32[r16]-HEAP32[r9]|0;r39=(HEAP32[r8]>>>0)/(r38>>>0)&-1;HEAP32[r8]=r39;r49=(r48>>>0)/(r39>>>0)&-1;if(r49>>>0>=r38>>>0){r12=-1;r4=421;break L454}if((r49|0)<(r51|0)){r39=HEAP32[r28>>2];r48=r39+1|0;r41=HEAPU8[r48];if((r41|0)>(r49|0)){r52=r39;r53=r48;r54=r41}else{r48=r28;r39=r41;while(1){r41=r48+4|0;r37=HEAP32[r41>>2];r55=r37+1|0;r56=HEAPU8[r55]+r39|0;if((r56|0)>(r49|0)){r52=r37;r53=r55;r54=r56;break}else{r48=r41;r39=r56}}}HEAP32[r11]=r54;HEAP32[r26]=r54-HEAPU8[r53];r39=r46+2|0;r48=HEAP8[r39];do{if((r48&255)<7){r49=r46+3|0;r56=HEAP8[r49]-1&255;HEAP8[r49]=r56;if(r56<<24>>24!=0){break}r56=r46|0;HEAP16[r56>>1]=HEAP16[r56>>1]<<1;HEAP8[r39]=r48+1&255;HEAP8[r49]=3<<(r48&255)&255}}while(0);HEAP32[r25]=r52;HEAP8[r53]=HEAP8[r53]+4&255;r48=r40+4|0;HEAP16[r48>>1]=HEAP16[r48>>1]+4&65535;if(HEAPU8[r53]>124){_rescale(r1,r40)}HEAP8[r29]=HEAP8[r29]+1&255;HEAP32[r31>>2]=HEAP32[r30>>2]}else{HEAP32[r26]=r51;HEAP32[r11]=r38;r48=r32;r39=HEAPU16[r42]-HEAP32[r17]|0;while(1){r49=r48+4|0;HEAP8[HEAPU8[HEAP32[r49>>2]|0]+r1+580|0]=HEAP8[r29];r56=r39-1|0;if((r56|0)==0){break}else{r48=r49;r39=r56}}r39=r46|0;HEAP16[r39>>1]=HEAPU16[r39>>1]+HEAP32[r15]&65535;HEAP32[r17]=HEAPU16[r42]}r39=HEAP32[r8];r48=HEAP32[r26];r38=(Math.imul(r48,r39)|0)+HEAP32[r9]|0;HEAP32[r9]=r38;r56=Math.imul(HEAP32[r11]-r48|0,r39)|0;HEAP32[r8]=r56;r39=HEAP32[r25];if((r39|0)==0){r34=r38;r35=r56;continue L454}else{r57=r39;r58=r23,r59=r58>>2;break L451}}}while(0);HEAP32[r16]=HEAP32[r16]<<8|_rar_get_char(r2,r3);r39=HEAP32[r8]<<8;HEAP32[r8]=r39;r56=HEAP32[r9]<<8;HEAP32[r9]=r56;r34=r56;r35=r39}if(r4==415){STACKTOP=r5;return r12}else if(r4==421){STACKTOP=r5;return r12}else if(r4==422){STACKTOP=r5;return r12}}else{r57=r27;r58=r1+552|0,r59=r58>>2}}while(0);r58=HEAPU8[r57|0];do{if((HEAP32[r59]|0)==0){r27=HEAP32[r57+4>>2];if(r27>>>0<=HEAP32[r10]>>>0){r4=360;break}HEAP32[r1+572>>2]=r27;HEAP32[r7]=r27}else{r4=360}}while(0);do{if(r4==360){r27=HEAP8[r57|0];r11=HEAP8[r57+1|0];r26=HEAP32[r57+4>>2];r42=r11&255;do{if((r11&255)<31){r46=HEAP32[HEAP32[r7]+12>>2];if((r46|0)==0){r60=0;break}r51=r46+4|0;if((HEAP16[r46>>1]|0)==1){r40=r51;r53=r40+1|0;r52=HEAP8[r53];HEAP8[r53]=((r52&255)<32)+r52&255;r60=r40;break}r40=HEAP32[r46+8>>2];do{if((HEAP8[r40|0]|0)==r27<<24>>24){r61=r40}else{r46=r40;while(1){r62=r46+8|0;if((HEAP8[r62|0]|0)==r27<<24>>24){break}else{r46=r62}}if(HEAPU8[r46+9|0]<HEAPU8[r46+1|0]){r61=r62;break}r52=r62>>2;r53=HEAP32[r52];r54=HEAP32[r52+1];r50=r46>>2;r47=HEAP32[r50+1];HEAP32[r52]=HEAP32[r50];HEAP32[r52+1]=r47;HEAP32[r50]=r53;HEAP32[r50+1]=r54;r61=r46}}while(0);r40=r61+1|0;r54=HEAP8[r40];if((r54&255)>=115){r60=r61;break}HEAP8[r40]=r54+2&255;r54=r51|0;HEAP16[r54>>1]=HEAP16[r54>>1]+2&65535;r60=r61}else{r60=0}}while(0);L520:do{if((HEAP32[r59]|0)==0){r11=_create_successors(r1,1,r60);HEAP32[HEAP32[r25]+4>>2]=r11;HEAP32[r1+572>>2]=r11;HEAP32[r7]=r11;if((r11|0)==0){r4=405}}else{r11=r1|0;r54=HEAP32[r10];HEAP32[r10]=r54+1;HEAP8[r54]=r27;r54=HEAP32[r10];r40=r54;if(r54>>>0>=HEAP32[r1+516>>2]>>>0){r4=405;break}do{if((r26|0)==0){HEAP32[HEAP32[r25]+4>>2]=r40;r50=HEAP32[r7];r63=r50;r64=r40;r65=r50}else{if(r26>>>0>r54>>>0){r66=r26}else{r50=_create_successors(r1,0,r60);if((r50|0)==0){r4=405;break L520}else{r66=r50}}r50=HEAP32[r59]-1|0;HEAP32[r59]=r50;if((r50|0)==0){r50=HEAP32[r7];HEAP32[r10]=(((HEAP32[r1+572>>2]|0)!=(r50|0))<<31>>31)+HEAP32[r10];r63=r66;r64=r66;r65=r50;break}else{r63=r66;r64=r40;r65=HEAP32[r7];break}}}while(0);r40=HEAP16[r65>>1];r54=r40&65535;r51=r1+572|0;r50=HEAP32[r51>>2];L534:do{if((r50|0)!=(r65|0)){r53=r1+80|0;r47=(r1+344|0)>>2;r52=r1+348|0;r44=r1+548|0;r45=(r40&65535)>3|0;r43=r42<<1;r13=1-r42-r54+HEAPU16[r65+4>>1]|0;r20=r50,r14=r20>>2;L536:while(1){r6=r20|0;r35=HEAP16[r6>>1];r34=r35&65535;if(r35<<16>>16==1){r16=HEAP16[r53>>1]|0;r23=(r16<<2)+r1+352|0;r17=HEAP32[r23>>2];do{if((r17|0)==0){r15=HEAP32[r47];r29=(r16<<1)+r1+4|0;r32=HEAP16[r29>>1]<<4;r30=r15+r32|0;HEAP32[r47]=r30;if(r30>>>0<=HEAP32[r52>>2]>>>0){r67=r15;break}HEAP32[r47]=r15+(r32-(HEAP16[r29>>1]<<4));r67=_sub_allocator_alloc_units_rare(r11,r16)}else{HEAP32[r23>>2]=HEAP32[r17>>2];r67=r17}}while(0);if((r67|0)==0){r4=405;break L520}r17=r20+4|0;r23=r17;r16=r67;r36=HEAP32[r23+4>>2];HEAP32[r16>>2]=HEAP32[r23>>2];HEAP32[r16+4>>2]=r36;HEAP32[r14+2]=r67;r36=r67+1|0;r16=HEAP8[r36];r23=(r16&255)<30?r16<<1:120;HEAP8[r36]=r23;r36=HEAP32[r44>>2]+r45+(r23&255)&65535;HEAP16[r17>>1]=r36;r68=r36;r69=r20+4|0}else{do{if((r34&1|0)==0){r70=(r20+8|0)>>2;r36=HEAP32[r70];r17=r36|0;r23=r34>>>1;r16=HEAP16[r1+(r23-1<<1)+80>>1];r29=r16<<16>>16;r32=HEAP16[r1+(r23<<1)+80>>1];if(r16<<16>>16==r32<<16>>16){HEAP32[r70]=r36;if((r36|0)==0){r4=405;break L520}else{break}}r16=r32<<16>>16;r32=(r16<<2)+r1+352|0;r15=HEAP32[r32>>2];do{if((r15|0)==0){r30=HEAP32[r47];r31=(r16<<1)+r1+4|0;r28=HEAP16[r31>>1]<<4;r33=r30+r28|0;HEAP32[r47]=r33;if(r33>>>0<=HEAP32[r52>>2]>>>0){r71=r30;break}HEAP32[r47]=r30+(r28-(HEAP16[r31>>1]<<4));r71=_sub_allocator_alloc_units_rare(r11,r16)}else{HEAP32[r32>>2]=HEAP32[r15>>2];r71=r15}}while(0);if((r71|0)==0){break L536}r15=r23<<4;_memcpy(r71,r17,r15)|0;r15=(r29<<2)+r1+352|0;HEAP32[r36>>2]=HEAP32[r15>>2];HEAP32[r15>>2]=r36;HEAP32[r70]=r71}}while(0);r15=r20+4|0;r32=HEAP16[r15>>1];r16=((r34<<2>>>0<=r54>>>0&(r32&65535)>>>0<=r34<<3>>>0&1)<<1|r34<<1>>>0<r54>>>0)+r32&65535;HEAP16[r15>>1]=r16;r68=r16;r69=r15}r15=r68&65535;r16=Math.imul(r15+6|0,r43)|0;r32=r13+r15|0;if(r16>>>0<(r32*6&-1)>>>0){r72=(r16>>>0>r32>>>0?2:1)+(r16>>>0>=r32<<2>>>0)&255;r73=r68+3&65535}else{r31=(r16>>>0>=(r32*15&-1)>>>0)+(r16>>>0>=(r32*12&-1)>>>0)+(r16>>>0>=(r32*9&-1)>>>0|4)|0;r72=r31&255;r73=r31+r15&65535}HEAP16[r69>>1]=r73;r15=HEAP32[r14+2];HEAP32[r15+(r34<<3)+4>>2]=r64;HEAP8[(r34<<3)+r15|0]=r27;HEAP8[(r34<<3)+r15+1|0]=r72;HEAP16[r6>>1]=r35+1&65535;r15=HEAP32[r14+3];if((r15|0)==(HEAP32[r7]|0)){break L534}else{r20=r15,r14=r20>>2}}HEAP32[r70]=0;r4=405;break L520}}while(0);HEAP32[r7]=r63;HEAP32[r51>>2]=r63}}while(0);do{if(r4==405){if((_restart_model_rare(r1)|0)==0){r12=-1;STACKTOP=r5;return r12}else{HEAP8[r1+1604|0]=0;break}}}while(0);r27=r1+1604|0;if((HEAP8[r27]|0)!=0){break}HEAP8[r27]=1;_memset(r1+580|0,0,256)}}while(0);r4=r1+524|0;r1=HEAP32[r9];r63=HEAP32[r8];while(1){if((r63+r1^r1)>>>0>=16777216){if(r63>>>0>=32768){r12=r58;break}HEAP32[r8]=-r1&32767}HEAP32[r4>>2]=HEAP32[r4>>2]<<8|_rar_get_char(r2,r3);r7=HEAP32[r8]<<8;HEAP32[r8]=r7;r70=HEAP32[r9]<<8;HEAP32[r9]=r70;r1=r70;r63=r7}STACKTOP=r5;return r12}function _create_successors(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+256|0;r6=r5;r7=HEAP32[r1+568>>2];r8=r1+576|0;r9=HEAP32[r8>>2];r10=HEAP32[r9+4>>2];r11=r6|0;if((r2|0)==0){r2=r6+4|0;HEAP32[r11>>2]=r9;if((HEAP32[r7+12>>2]|0)==0){r12=r2;r13=r7}else{r14=r2;r4=427}}else{r14=r11;r4=427}do{if(r4==427){r2=HEAP32[r7+12>>2];if((r3|0)==0){r15=r14;r16=r2}else{r17=r2;r18=r14;r19=r3;r4=432}L586:while(1){if(r4==432){r4=0;r2=HEAP32[r19+4>>2];if((r2|0)!=(r10|0)){r20=r2;r21=r18;break}r2=r18+4|0;HEAP32[r18>>2]=r19;r9=HEAP32[r17+12>>2];if((r9|0)==0){r20=r17;r21=r2;break}else{r15=r2;r16=r9}}if((HEAP16[r16>>1]|0)==1){r17=r16;r18=r15;r19=r16+4|0;r4=432;continue}r9=HEAP32[r16+8>>2];r2=HEAP8[HEAP32[r8>>2]|0];if((HEAP8[r9|0]|0)==r2<<24>>24){r17=r16;r18=r15;r19=r9;r4=432;continue}else{r22=r9}while(1){r9=r22+8|0;if((HEAP8[r9|0]|0)==r2<<24>>24){r17=r16;r18=r15;r19=r9;r4=432;continue L586}else{r22=r9}}}if((r21|0)==(r11|0)){r23=r20}else{r12=r21;r13=r20;break}STACKTOP=r5;return r23}}while(0);r20=r10;r10=HEAP8[r20];r21=r20+1|0;r20=HEAP16[r13>>1];if(r20<<16>>16==1){r24=HEAP8[r13+5|0]}else{if(r13>>>0<=HEAP32[r1+504>>2]>>>0){r23=0;STACKTOP=r5;return r23}r22=HEAP32[r13+8>>2];if((HEAP8[r22|0]|0)==r10<<24>>24){r25=r22}else{r19=r22;while(1){r22=r19+8|0;if((HEAP8[r22|0]|0)==r10<<24>>24){r25=r22;break}else{r19=r22}}}r19=HEAPU8[r25+1|0];r25=r19-1|0;r22=HEAPU16[r13+4>>1]-(r20&65535)+(1-r19)|0;r19=r25<<1;if(r19>>>0>r22>>>0){r26=((r19-1+(r22*3&-1)|0)>>>0)/(r22<<1>>>0)&-1}else{r26=(r25*5&-1)>>>0>r22>>>0|0}r24=r26+1&255}r26=r1|0;r22=r1+348|0;r25=r1+344|0;r19=r1+352|0;r1=r24&255;r24=r10&255|(r1<<8|0>>>24);r10=r21|(0<<8|r1>>>24);r1=r13;r13=r12;while(1){r12=r13-4|0;r21=HEAP32[r12>>2];r20=HEAP32[r22>>2];if((r20|0)==(HEAP32[r25>>2]|0)){r15=HEAP32[r19>>2];if((r15|0)==0){r27=_sub_allocator_alloc_units_rare(r26,0)}else{HEAP32[r19>>2]=HEAP32[r15>>2];r27=r15}r15=r27;if((r27|0)==0){r28=r15}else{r29=r27;r30=r15;r4=451}}else{r15=r20-16|0;HEAP32[r22>>2]=r15;r29=r15;r30=r15;r4=451}if(r4==451){r4=0;HEAP16[r29>>1]=1;r15=r29+4|0;HEAP32[r15>>2]=r24;HEAP32[r15+4>>2]=r10;HEAP32[r29+12>>2]=r1;HEAP32[r21+4>>2]=r30;r28=r30}if((r28|0)==0){r23=0;r4=456;break}if((r12|0)==(r11|0)){r23=r28;r4=457;break}else{r1=r28;r13=r12}}if(r4==456){STACKTOP=r5;return r23}else if(r4==457){STACKTOP=r5;return r23}}function _restart_model_rare(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;_memset(r1+580|0,0,256);_memset(r1+352|0,0,152);r2=HEAP32[r1+340>>2];HEAP32[r1+504>>2]=r2;r3=HEAP32[r1>>2];r4=((((r3|0)/8&-1)>>>0)/12&-1)*84&-1;r5=r3-r4|0;r3=((r5>>>0)/12&-1)<<4|(r5>>>0)%12&-1;r6=(r1+348|0)>>2;r7=r2+r3|0;HEAP32[r1+508>>2]=r7;r8=(r1+344|0)>>2;HEAP32[r8]=r7;HEAP32[r1+516>>2]=r2+r5;HEAP32[r6]=(((r4>>>0)/12&-1)<<4)+r2+r3;HEAP16[r1+4>>1]=1;HEAP16[r1+6>>1]=2;HEAP16[r1+8>>1]=3;HEAP16[r1+10>>1]=4;HEAP16[r1+12>>1]=6;HEAP16[r1+14>>1]=8;HEAP16[r1+16>>1]=10;HEAP16[r1+18>>1]=12;HEAP16[r1+20>>1]=15;HEAP16[r1+22>>1]=18;HEAP16[r1+24>>1]=21;HEAP16[r1+26>>1]=24;r3=r1|0;r2=28;r4=12;while(1){HEAP16[r1+(r4<<1)+4>>1]=r2&65535;r5=r4+1|0;if((r5|0)<38){r2=r2+4|0;r4=r5}else{break}}HEAP16[r1+336>>1]=0;r4=0;r2=0;while(1){r5=r4+1|0;r7=((HEAP16[r1+(r2<<1)+4>>1]|0)<(r5|0))+r2|0;HEAP16[r1+(r4<<1)+80>>1]=r7&65535;if((r5|0)<128){r4=r5;r2=r7}else{break}}r2=r1+556|0;r4=HEAP32[r2>>2];r7=r1+564|0;HEAP32[r7>>2]=(r4|0)<12?~r4:-13;r4=HEAP32[r6];do{if((r4|0)==(HEAP32[r8]|0)){r5=r1+352|0;r9=HEAP32[r5>>2];if((r9|0)==0){r10=_sub_allocator_alloc_units_rare(r3,0)}else{HEAP32[r5>>2]=HEAP32[r9>>2];r10=r9}r9=r10;HEAP32[r1+572>>2]=r9;r5=r1+568|0;HEAP32[r5>>2]=r9;if((r10|0)==0){r11=0}else{r12=r10;r13=r5,r14=r13>>2;break}return r11}else{r5=r4-16|0;HEAP32[r6]=r5;r9=r5;HEAP32[r1+572>>2]=r9;r15=r1+568|0;HEAP32[r15>>2]=r9;r12=r5;r13=r15,r14=r13>>2}}while(0);HEAP32[r12+12>>2]=0;HEAP32[r1+552>>2]=HEAP32[r2>>2];HEAP16[HEAP32[r14]>>1]=256;HEAP16[HEAP32[r14]+4>>1]=257;r2=HEAP16[r1+334>>1]|0;r12=(r2<<2)+r1+352|0;r13=HEAP32[r12>>2];do{if((r13|0)==0){r4=HEAP32[r8];r10=(r2<<1)+r1+4|0;r15=HEAP16[r10>>1]<<4;r5=r4+r15|0;HEAP32[r8]=r5;if(r5>>>0<=HEAP32[r6]>>>0){r16=r4;break}HEAP32[r8]=r4+(r15-(HEAP16[r10>>1]<<4));r16=_sub_allocator_alloc_units_rare(r3,r2)}else{HEAP32[r12>>2]=HEAP32[r13>>2];r16=r13}}while(0);r13=r16;HEAP32[HEAP32[r14]+8>>2]=r13;HEAP32[r1+576>>2]=r13;if((r16|0)==0){r11=0;return r11}HEAP32[r1+560>>2]=HEAP32[r7>>2];HEAP8[r1+1605|0]=0;r7=0;while(1){HEAP8[(r7<<3)+HEAP32[HEAP32[r14]+8>>2]|0]=r7&255;HEAP8[(r7<<3)+HEAP32[HEAP32[r14]+8>>2]+1|0]=1;HEAP32[HEAP32[HEAP32[r14]+8>>2]+(r7<<3)+4>>2]=0;r16=r7+1|0;if((r16|0)<256){r7=r16}else{r17=0;break}}while(1){r7=r17+2|0;r14=0;while(1){r16=16384-((HEAPU16[(r14<<1)+304>>1]|0)/(r7|0)&-1)&65535;HEAP16[r1+(r17<<7)+(r14<<1)+3212>>1]=r16;HEAP16[r1+(r17<<7)+(r14+8<<1)+3212>>1]=r16;HEAP16[r1+(r17<<7)+(r14+16<<1)+3212>>1]=r16;HEAP16[r1+(r17<<7)+(r14+24<<1)+3212>>1]=r16;HEAP16[r1+(r17<<7)+(r14+32<<1)+3212>>1]=r16;HEAP16[r1+(r17<<7)+(r14+40<<1)+3212>>1]=r16;HEAP16[r1+(r17<<7)+(r14+48<<1)+3212>>1]=r16;HEAP16[r1+(r17<<7)+(r14+56<<1)+3212>>1]=r16;r16=r14+1|0;if((r16|0)<8){r14=r16}else{break}}r14=r17+1|0;if((r14|0)<128){r17=r14}else{r18=0;break}}while(1){r17=(r18*40&-1)+80&65535;HEAP8[(r18<<6)+r1+1610|0]=3;HEAP16[r1+(r18<<6)+1608>>1]=r17;HEAP8[(r18<<6)+r1+1611|0]=4;HEAP8[(r18<<6)+r1+1614|0]=3;HEAP16[r1+(r18<<6)+1612>>1]=r17;HEAP8[(r18<<6)+r1+1615|0]=4;HEAP8[(r18<<6)+r1+1618|0]=3;HEAP16[r1+(r18<<6)+1616>>1]=r17;HEAP8[(r18<<6)+r1+1619|0]=4;HEAP8[(r18<<6)+r1+1622|0]=3;HEAP16[r1+(r18<<6)+1620>>1]=r17;HEAP8[(r18<<6)+r1+1623|0]=4;HEAP8[(r18<<6)+r1+1626|0]=3;HEAP16[r1+(r18<<6)+1624>>1]=r17;HEAP8[(r18<<6)+r1+1627|0]=4;HEAP8[(r18<<6)+r1+1630|0]=3;HEAP16[r1+(r18<<6)+1628>>1]=r17;HEAP8[(r18<<6)+r1+1631|0]=4;HEAP8[(r18<<6)+r1+1634|0]=3;HEAP16[r1+(r18<<6)+1632>>1]=r17;HEAP8[(r18<<6)+r1+1635|0]=4;HEAP8[(r18<<6)+r1+1638|0]=3;HEAP16[r1+(r18<<6)+1636>>1]=r17;HEAP8[(r18<<6)+r1+1639|0]=4;HEAP8[(r18<<6)+r1+1642|0]=3;HEAP16[r1+(r18<<6)+1640>>1]=r17;HEAP8[(r18<<6)+r1+1643|0]=4;HEAP8[(r18<<6)+r1+1646|0]=3;HEAP16[r1+(r18<<6)+1644>>1]=r17;HEAP8[(r18<<6)+r1+1647|0]=4;HEAP8[(r18<<6)+r1+1650|0]=3;HEAP16[r1+(r18<<6)+1648>>1]=r17;HEAP8[(r18<<6)+r1+1651|0]=4;HEAP8[(r18<<6)+r1+1654|0]=3;HEAP16[r1+(r18<<6)+1652>>1]=r17;HEAP8[(r18<<6)+r1+1655|0]=4;HEAP8[(r18<<6)+r1+1658|0]=3;HEAP16[r1+(r18<<6)+1656>>1]=r17;HEAP8[(r18<<6)+r1+1659|0]=4;HEAP8[(r18<<6)+r1+1662|0]=3;HEAP16[r1+(r18<<6)+1660>>1]=r17;HEAP8[(r18<<6)+r1+1663|0]=4;HEAP8[(r18<<6)+r1+1666|0]=3;HEAP16[r1+(r18<<6)+1664>>1]=r17;HEAP8[(r18<<6)+r1+1667|0]=4;HEAP8[(r18<<6)+r1+1670|0]=3;HEAP16[r1+(r18<<6)+1668>>1]=r17;HEAP8[(r18<<6)+r1+1671|0]=4;r17=r18+1|0;if((r17|0)<25){r18=r17}else{r11=1;break}}return r11}function _sub_allocator_alloc_units_rare(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=(r1+336|0)>>1;do{if((HEAP16[r6]|0)==0){HEAP16[r6]=255;r7=HEAP32[r1+344>>2];if((r7|0)!=(HEAP32[r1+348>>2]|0)){HEAP8[r7]=0}HEAP32[r5+8>>2]=r5;r7=(r5+4|0)>>2;HEAP32[r7]=r5;r8=r5;r9=0;while(1){r10=((r9<<2)+r1+352|0)>>2;r11=HEAP32[r10];if((r11|0)!=0){r12=(r9<<1)+r1+4|0;r13=r11;while(1){HEAP32[r10]=HEAP32[r13>>2];r11=r13;HEAP32[r13+8>>2]=r8;r14=HEAP32[r7];HEAP32[r13+4>>2]=r14;HEAP32[r14+8>>2]=r11;HEAP32[r7]=r11;HEAP16[r13>>1]=-1;HEAP16[r13+2>>1]=HEAP16[r12>>1];r11=HEAP32[r10];if((r11|0)==0){break}else{r13=r11}}}r13=r9+1|0;if((r13|0)<38){r9=r13}else{break}}r9=HEAP32[r7];do{if((r9|0)!=(r5|0)){r8=r9;while(1){r13=(r8+2|0)>>1;r10=HEAPU16[r13];r12=r8;r11=r10<<4;L681:do{if((HEAP16[r12+r11>>1]|0)==-1){r14=r10;r15=r11;while(1){r16=r12+(r15|2)|0;if((HEAPU16[r16>>1]+r14|0)>=65536){break L681}r17=r12+(r15|4)|0;r18=r12+(r15|8)|0;HEAP32[HEAP32[r18>>2]+4>>2]=HEAP32[r17>>2];HEAP32[HEAP32[r17>>2]+8>>2]=HEAP32[r18>>2];r18=HEAP16[r13]+HEAP16[r16>>1]&65535;HEAP16[r13]=r18;r16=r18&65535;r18=r16<<4;if((HEAP16[r12+r18>>1]|0)==-1){r14=r16;r15=r18}else{break}}}}while(0);r12=HEAP32[r8+4>>2];if((r12|0)==(r5|0)){break}else{r8=r12}}r8=HEAP32[r7];if((r8|0)==(r5|0)){break}r12=r1+500|0;r13=r8;while(1){r8=r13+4|0;r11=r13+8|0;HEAP32[HEAP32[r11>>2]+4>>2]=HEAP32[r8>>2];HEAP32[HEAP32[r8>>2]+8>>2]=HEAP32[r11>>2];r11=HEAP16[r13+2>>1];r8=r11&65535;if((r11&65535)>128){r11=127-r8|0;r10=(((r11|0)>-129?r11:-129)+r8|0)>>>7;r11=(r10<<11)+r13+2048|0;r15=r13;r14=r8;r18=HEAP32[r12>>2];while(1){r16=r15;HEAP32[r15>>2]=r18;HEAP32[r12>>2]=r16;r17=r14-128|0;if((r17|0)>128){r15=r15+2048|0;r14=r17;r18=r16}else{break}}r19=r11;r20=r8-128-(r10<<7)|0}else{r19=r13;r20=r8}r18=r20-1|0;r14=HEAP16[r1+(r18<<1)+80>>1]|0;if((HEAP16[r1+(r14<<1)+4>>1]|0)==(r20|0)){r21=r14}else{r15=r14-1|0;r14=HEAP16[r1+(r15<<1)+4>>1]|0;r16=(r14<<4)+r19|0;r17=(r18-r14<<2)+r1+352|0;HEAP32[r16>>2]=HEAP32[r17>>2];HEAP32[r17>>2]=r16;r21=r15}r15=(r21<<2)+r1+352|0;HEAP32[r19>>2]=HEAP32[r15>>2];HEAP32[r15>>2]=r19;r15=HEAP32[r7];if((r15|0)==(r5|0)){break}else{r13=r15}}}}while(0);r7=(r2<<2)+r1+352|0;r9=HEAP32[r7>>2];if((r9|0)==0){r22=r2;break}HEAP32[r7>>2]=HEAP32[r9>>2];r23=r9;STACKTOP=r4;return r23}else{r22=r2}}while(0);while(1){r24=r22+1|0;if((r24|0)==38){r3=509;break}r25=(r24<<2)+r1+352|0;r26=HEAP32[r25>>2];if((r26|0)==0){r22=r24}else{r3=512;break}}if(r3==512){HEAP32[r25>>2]=HEAP32[r26>>2];r25=r26;r26=HEAP16[r1+(r2<<1)+4>>1]|0;r22=HEAP16[r1+(r24<<1)+4>>1]-r26|0;r24=r26<<4;r26=r25+r24|0;r5=HEAP16[r1+(r22-1<<1)+80>>1]|0;if((HEAP16[r1+(r5<<1)+4>>1]|0)==(r22|0)){r27=r26;r28=r22}else{r19=r5-1|0;r5=(r19<<2)+r1+352|0;HEAP32[r26>>2]=HEAP32[r5>>2];HEAP32[r5>>2]=r26;r26=HEAP16[r1+(r19<<1)+4>>1]|0;r27=(r26<<4)+r25+r24|0;r28=r22-r26|0}r26=(HEAP16[r1+(r28-1<<1)+80>>1]<<2)+r1+352|0;HEAP32[r27>>2]=HEAP32[r26>>2];HEAP32[r26>>2]=r27;r23=r25;STACKTOP=r4;return r23}else if(r3==509){HEAP16[r6]=HEAP16[r6]-1&65535;r6=HEAP16[r1+(r2<<1)+4>>1]|0;r2=r6*12&-1;r3=r1+516|0;r25=HEAP32[r3>>2];if((r25-HEAP32[r1+504>>2]|0)<=(r2|0)){r23=0;STACKTOP=r4;return r23}HEAP32[r3>>2]=r25+ -r2;r2=r1+508|0;r1=HEAP32[r2>>2]+ -(r6<<4)|0;HEAP32[r2>>2]=r1;r23=r1;STACKTOP=r4;return r23}}function _rescale(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36;r3=STACKTOP;STACKTOP=STACKTOP+16|0;r4=r3;r5=r3+8;r6=(r2|0)>>1;r7=HEAPU16[r6];r8=r7-1|0;r9=(r1+576|0)>>2;r10=HEAP32[r9];r11=r2+4|0;r12=(r2+8|0)>>2;if((r10|0)==(HEAP32[r12]|0)){r13=r10}else{r14=r10;r15=HEAP32[r14>>2];r16=HEAP32[r14+4>>2];r14=r10;while(1){r10=r14-8|0;r17=r14;r18=r10>>2;r19=HEAP32[r18+1];HEAP32[r17>>2]=HEAP32[r18];HEAP32[r17+4>>2]=r19;HEAP32[r18]=r15;HEAP32[r18+1]=r16;if((r10|0)==(HEAP32[r12]|0)){r13=r10;break}else{r14=r10}}}r14=r13+1|0;HEAP8[r14]=HEAP8[r14]+4&255;r14=(r11|0)>>1;r16=HEAP16[r14]+4&65535;HEAP16[r14]=r16;r15=r13+1|0;r10=HEAPU8[r15];r18=(HEAP32[r1+552>>2]|0)!=0|0;r19=(r18+r10|0)>>>1;HEAP8[r15]=r19&255;HEAP16[r14]=r19&255;r19=(r4|0)>>1;r4=(r7<<3)+r13|0;r15=r8;r17=(r16&65535)-r10|0;r10=r13;while(1){r16=r10+8|0;r20=r10+9|0;r21=HEAPU8[r20];r22=r17-r21|0;r23=(r21+r18|0)>>>1;HEAP8[r20]=r23&255;HEAP16[r14]=(r23&255)+HEAPU16[r14]&65535;r23=HEAP8[r20];if((r23&255)>HEAPU8[r10+1|0]){r20=r16|0;r21=HEAP8[r20];r24=(r20+2|0)>>1;HEAP16[r19]=HEAP16[r24];HEAP16[r19+1]=HEAP16[r24+1];HEAP16[r19+2]=HEAP16[r24+2];r24=r16;while(1){r20=r24-8|0;r25=r20|0;r26=r20;r27=r24;r28=HEAP32[r26+4>>2];HEAP32[r27>>2]=HEAP32[r26>>2];HEAP32[r27+4>>2]=r28;if((r20|0)==(HEAP32[r12]|0)){break}if((r23&255)>HEAPU8[r24-16+1|0]){r24=r20}else{break}}HEAP8[r25]=r21;HEAP8[r24-8+1|0]=r23;r20=(r25+2|0)>>1;HEAP16[r20]=HEAP16[r19];HEAP16[r20+1]=HEAP16[r19+1];HEAP16[r20+2]=HEAP16[r19+2]}r20=r15-1|0;if((r20|0)==0){break}else{r15=r20;r17=r22;r10=r16}}do{if((HEAP8[r4-7|0]|0)==0){r10=0;r17=(r8<<3)+r13|0;while(1){r29=r10+1|0;if((HEAP8[r17-8+1|0]|0)==0){r10=r29;r17=r17-8|0}else{break}}r17=r29+r22|0;r10=HEAPU16[r6]-r29|0;r16=r10&65535;HEAP16[r6]=r16;if((r10&65535|0)!=1){r30=r17;r31=r16;break}r16=HEAP32[r12];r10=r16|0;r23=HEAP8[r10];r24=HEAP8[r16+1|0];r21=(r10+2|0)>>1;r10=(r5|0)>>1;HEAP16[r10]=HEAP16[r21];HEAP16[r10+1]=HEAP16[r21+1];HEAP16[r10+2]=HEAP16[r21+2];r21=r24;r24=r17;while(1){r32=r21-((r21&255)>>>1)&255;r17=r24>>1;if((r17|0)>1){r21=r32;r24=r17}else{break}}r24=(HEAP16[r1+(((r7+1|0)>>>1)-1<<1)+80>>1]<<2)+r1+352|0;HEAP32[r16>>2]=HEAP32[r24>>2];HEAP32[r24>>2]=r16;r24=r11;HEAP32[r9]=r24;HEAP8[r11]=r23;HEAP8[r24+1|0]=r32;r24=(r2+6|0)>>1;HEAP16[r24]=HEAP16[r10];HEAP16[r24+1]=HEAP16[r10+1];HEAP16[r24+2]=HEAP16[r10+2];STACKTOP=r3;return}else{r30=r22;r31=HEAP16[r6]}}while(0);HEAP16[r14]=r30-(r30>>>1)+HEAPU16[r14]&65535;r14=(r7+1|0)>>>1;r7=((r31&65535)+1|0)>>>1;r31=HEAP32[r12];if((r14|0)==(r7|0)){r33=r31}else{r30=r31|0;r6=HEAP16[r1+(r14-1<<1)+80>>1];r14=r6<<16>>16;r22=HEAP16[r1+(r7-1<<1)+80>>1];r2=r22<<16>>16;do{if(r6<<16>>16==r22<<16>>16){r34=r30}else{r32=(r2<<2)+r1+352|0;r11=HEAP32[r32>>2];if((r11|0)!=0){HEAP32[r32>>2]=HEAP32[r11>>2];r32=r11;r11=r7<<4;_memcpy(r32,r30,r11)|0;r11=(r14<<2)+r1+352|0;HEAP32[r31>>2]=HEAP32[r11>>2];HEAP32[r11>>2]=r31;r34=r32;break}r32=HEAP16[r1+(r2<<1)+4>>1]|0;r11=HEAP16[r1+(r14<<1)+4>>1]-r32|0;r5=r32<<4;r32=r30+r5|0;r29=HEAP16[r1+(r11-1<<1)+80>>1]|0;if((HEAP16[r1+(r29<<1)+4>>1]|0)==(r11|0)){r35=r32;r36=r11}else{r13=r29-1|0;r29=(r13<<2)+r1+352|0;HEAP32[r32>>2]=HEAP32[r29>>2];HEAP32[r29>>2]=r32;r32=HEAP16[r1+(r13<<1)+4>>1]|0;r35=(r32<<4)+r30+r5|0;r36=r11-r32|0}r32=(HEAP16[r1+(r36-1<<1)+80>>1]<<2)+r1+352|0;HEAP32[r35>>2]=HEAP32[r32>>2];HEAP32[r32>>2]=r35;r34=r30}}while(0);r30=r34;HEAP32[r12]=r30;r33=r30}HEAP32[r9]=r33;STACKTOP=r3;return}function _unpack_init_data20(r1,r2){if((r1|0)!=0){return}HEAP32[r2+4249604>>2]=0;HEAP32[r2+4249600>>2]=0;HEAP32[r2+4249612>>2]=1;_memset(r2+4255284|0,0,368);_memset(r2+4249616|0,0,1028);return}function _rar_unpack20(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63;r4=0;_unpack_init_data(r2,r3);if((_unp_read_buf(r1,r3)|0)==0){r5=0;return r5}do{if((r2|0)==0){if((_read_tables20(r1,r3)|0)==0){r5=0}else{break}return r5}}while(0);r2=(r3+4249544|0)>>2;r6=HEAP32[r2];r7=HEAP32[r2+1];HEAP32[r2]=_i64Add(r6,r7,-1,-1);HEAP32[r2+1]=tempRet0;r8=0;L770:do{if((r7|0)>(r8|0)|(r7|0)==(r8|0)&r6>>>0>0>>>0){r9=(r3+4227084|0)>>2;r10=r3+4227076|0;r11=r3+4227096|0;r12=r3+4227088|0;r13=r3+4249608|0;r14=r3+4227520|0;r15=r3+4228848|0;r16=(r3+4229892|0)>>2;r17=r3+4229420|0;r18=r3+4229896|0;r19=r3+4229900|0;r20=(r3+4249600|0)>>2;r21=(r3+4249604|0)>>2;r22=r3+4249612|0;L773:while(1){r23=HEAP32[r9]&4194303;HEAP32[r9]=r23;if((HEAP32[r10>>2]|0)>(HEAP32[r11>>2]-30|0)){if((_unp_read_buf(r1,r3)|0)==0){r24=r11;r25=r10;break L770}r26=HEAP32[r9]}else{r26=r23}r23=HEAP32[r12>>2];if(!((r23-r26&4194302)>>>0>269|(r23|0)==(r26|0))){_unp_write_buf_old(r3)}do{if((HEAP32[r13>>2]|0)==0){r23=_decode_number(r3,r14);if((r23|0)<256){r27=HEAP32[r9];HEAP32[r9]=r27+1;HEAP8[r3+(r27+32772)|0]=r23&255;r27=_i64Add(HEAP32[r2],HEAP32[r2+1],-1,-1);r28=tempRet0;HEAP32[r2]=r27;HEAP32[r2+1]=r28;r29=r28;r30=r27;break}if((r23|0)>269){r27=r23-270|0;r28=HEAPU8[r27+720|0]+3|0;r31=HEAPU8[r27+752|0];if((r23-278|0)>>>0<20){r27=(_getbits(r3)>>>((16-r31|0)>>>0))+r28|0;_addbits(r3,r31);r32=r27}else{r32=r28}r28=_decode_number(r3,r15);r27=HEAP32[(r28<<2)+784>>2]+1|0;r31=HEAPU8[r28+976|0];if((r28-4|0)>>>0<44){r28=(_getbits(r3)>>>((16-r31|0)>>>0))+r27|0;_addbits(r3,r31);r33=r28}else{r33=r27}if(r33>>>0>8191){r34=(r33>>>0>262143?2:1)+r32|0}else{r34=r32}_copy_string20(r3,r34,r33);r4=561;break}if((r23|0)==256){_copy_string20(r3,HEAP32[r19>>2],HEAP32[r18>>2]);r4=561;break}else if((r23|0)==269){if((_read_tables20(r1,r3)|0)==0){r5=0;r4=629;break L773}else{r4=561;break}}else{if((r23|0)>=261){r27=r23-261|0;r28=HEAPU8[r27+712|0];r31=(HEAPU8[r27+704|0]+1|0)+(_getbits(r3)>>>((16-r28|0)>>>0))|0;_addbits(r3,r28);r28=HEAP32[r16];HEAP32[r16]=r28+1;HEAP32[r3+((r28&3)<<2)+4229876>>2]=r31;HEAP32[r18>>2]=r31;HEAP32[r19>>2]=2;HEAP32[r2]=_i64Add(HEAP32[r2],HEAP32[r2+1],-2,-1);HEAP32[r2+1]=tempRet0;r28=HEAP32[r9];r27=r28-r31|0;r31=r27+1|0;if(r27>>>0<4194004&r28>>>0<4194004){r35=HEAP8[r3+(r27+32772)|0];HEAP32[r9]=r28+1;HEAP8[r3+(r28+32772)|0]=r35;r35=HEAP8[r3+(r31+32772)|0];r36=HEAP32[r9];HEAP32[r9]=r36+1;HEAP8[r3+(r36+32772)|0]=r35;r4=561;break}else{HEAP8[r3+(r28+32772)|0]=HEAP8[(r27&4194303)+r3+32772|0];r27=HEAP32[r9]+1&4194303;HEAP32[r9]=r27;HEAP8[r3+(r27+32772)|0]=HEAP8[(r31&4194303)+r3+32772|0];HEAP32[r9]=HEAP32[r9]+1&4194303;r4=561;break}}r31=HEAP32[r3+((HEAP32[r16]-r23&3)<<2)+4229876>>2];r23=_decode_number(r3,r17);r27=HEAPU8[r23+720|0]+2|0;r28=HEAPU8[r23+752|0];if((r23-8|0)>>>0<20){r23=(_getbits(r3)>>>((16-r28|0)>>>0))+r27|0;_addbits(r3,r28);r37=r23}else{r37=r27}do{if(r31>>>0>256){if(r31>>>0<=8191){r38=r37+1|0;break}r38=r37+(r31>>>0>262143?3:2)|0}else{r38=r37}}while(0);_copy_string20(r3,r38,r31);r4=561;break}}else{r27=_decode_number(r3,r3+(HEAP32[r20]*1160&-1)+4250644|0);if((r27|0)==256){if((_read_tables20(r1,r3)|0)==0){r5=0;r4=626;break L773}else{r4=561;break}}r23=HEAP32[r20];r28=(r3+(r23*92&-1)+4255368|0)>>2;HEAP32[r28]=HEAP32[r28]+1;r35=r3+(r23*92&-1)+4255312|0;r36=HEAP32[r35>>2];r39=r3+(r23*92&-1)+4255316|0;HEAP32[r39>>2]=r36;r40=r3+(r23*92&-1)+4255308|0;r41=HEAP32[r40>>2];HEAP32[r35>>2]=r41;r35=r3+(r23*92&-1)+4255320|0;r42=HEAP32[r35>>2];r43=r3+(r23*92&-1)+4255304|0;r44=r42-HEAP32[r43>>2]|0;HEAP32[r40>>2]=r44;HEAP32[r43>>2]=r42;r43=(r3+(r23*92&-1)+4255372|0)>>2;r40=(r3+(r23*92&-1)+4255284|0)>>2;r45=(r3+(r23*92&-1)+4255288|0)>>2;r46=(r3+(r23*92&-1)+4255292|0)>>2;r47=(r3+(r23*92&-1)+4255296|0)>>2;r48=(r3+(r23*92&-1)+4255300|0)>>2;r49=(((((((HEAP32[r43]<<3)+Math.imul(HEAP32[r40],r42)|0)+Math.imul(HEAP32[r45],r44)|0)+Math.imul(HEAP32[r46],r41)|0)+Math.imul(HEAP32[r47],r36)|0)+Math.imul(HEAP32[r21],HEAP32[r48])|0)>>>3&255)-r27|0;r50=r27<<24;r27=r50>>21;r51=(r3+(r23*92&-1)+4255324|0)>>2;HEAP32[r51]=HEAP32[r51]+((r50|0)>-2097152?r27:-r27|0);r50=r27-r42|0;r52=(r3+(r23*92&-1)+4255328|0)>>2;HEAP32[r52]=HEAP32[r52]+((r50|0)>-1?r50:-r50|0);r50=r42+r27|0;r42=(r3+(r23*92&-1)+4255332|0)>>2;HEAP32[r42]=HEAP32[r42]+((r50|0)>-1?r50:-r50|0);r50=r27-r44|0;r53=(r3+(r23*92&-1)+4255336|0)>>2;HEAP32[r53]=HEAP32[r53]+((r50|0)>-1?r50:-r50|0);r50=r44+r27|0;r44=(r3+(r23*92&-1)+4255340|0)>>2;HEAP32[r44]=HEAP32[r44]+((r50|0)>-1?r50:-r50|0);r50=r27-r41|0;r54=(r3+(r23*92&-1)+4255344|0)>>2;HEAP32[r54]=HEAP32[r54]+((r50|0)>-1?r50:-r50|0);r50=r41+r27|0;r41=(r3+(r23*92&-1)+4255348|0)>>2;HEAP32[r41]=HEAP32[r41]+((r50|0)>-1?r50:-r50|0);r50=r27-r36|0;r36=(r3+(r23*92&-1)+4255352|0)>>2;HEAP32[r36]=HEAP32[r36]+((r50|0)>-1?r50:-r50|0);r50=HEAP32[r39>>2]+r27|0;r39=(r3+(r23*92&-1)+4255356|0)>>2;HEAP32[r39]=((r50|0)>-1?r50:-r50|0)+HEAP32[r39];r50=r27-HEAP32[r21]|0;r55=(r3+(r23*92&-1)+4255360|0)>>2;HEAP32[r55]=((r50|0)>-1?r50:-r50|0)+HEAP32[r55];r50=HEAP32[r21]+r27|0;r27=(r3+(r23*92&-1)+4255364|0)>>2;HEAP32[r27]=((r50|0)>-1?r50:-r50|0)+HEAP32[r27];r50=r49-HEAP32[r43]<<24>>24;HEAP32[r35>>2]=r50;HEAP32[r21]=r50;HEAP32[r43]=r49;do{if((HEAP32[r28]&31|0)==0){r43=HEAP32[r51];HEAP32[r51]=0;r50=HEAP32[r52];r35=r50>>>0<r43>>>0;r23=r35?r50:r43;HEAP32[r52]=0;r43=HEAP32[r42];r50=r43>>>0<r23>>>0;r56=r50?r43:r23;HEAP32[r42]=0;r23=HEAP32[r53];r43=r23>>>0<r56>>>0;r57=r43?r23:r56;HEAP32[r53]=0;r56=HEAP32[r44];r23=r56>>>0<r57>>>0;r58=r23?r56:r57;HEAP32[r44]=0;r57=HEAP32[r54];r56=r57>>>0<r58>>>0;r59=r56?r57:r58;HEAP32[r54]=0;r58=HEAP32[r41];r57=r58>>>0<r59>>>0;r60=r57?r58:r59;HEAP32[r41]=0;r59=HEAP32[r36];r58=r59>>>0<r60>>>0;r61=r58?r59:r60;HEAP32[r36]=0;r60=HEAP32[r39];r59=r60>>>0<r61>>>0;r62=r59?r60:r61;HEAP32[r39]=0;r61=HEAP32[r55];r60=r61>>>0<r62>>>0;HEAP32[r55]=0;r63=HEAP32[r27]>>>0<(r60?r61:r62)>>>0?10:r60?9:r59?8:r58?7:r57?6:r56?5:r23?4:r43?3:r50?2:r35&1;HEAP32[r27]=0;if((r63|0)==5){r35=HEAP32[r46];if((r35|0)<=-17){break}HEAP32[r46]=r35-1;break}else if((r63|0)==4){r35=HEAP32[r45];if((r35|0)>=16){break}HEAP32[r45]=r35+1;break}else if((r63|0)==1){r35=HEAP32[r40];if((r35|0)<=-17){break}HEAP32[r40]=r35-1;break}else if((r63|0)==6){r35=HEAP32[r46];if((r35|0)>=16){break}HEAP32[r46]=r35+1;break}else if((r63|0)==7){r35=HEAP32[r47];if((r35|0)<=-17){break}HEAP32[r47]=r35-1;break}else if((r63|0)==8){r35=HEAP32[r47];if((r35|0)>=16){break}HEAP32[r47]=r35+1;break}else if((r63|0)==9){r35=HEAP32[r48];if((r35|0)<=-17){break}HEAP32[r48]=r35-1;break}else if((r63|0)==10){r35=HEAP32[r48];if((r35|0)>=16){break}HEAP32[r48]=r35+1;break}else if((r63|0)==3){r35=HEAP32[r45];if((r35|0)<=-17){break}HEAP32[r45]=r35-1;break}else if((r63|0)==2){r63=HEAP32[r40];if((r63|0)>=16){break}HEAP32[r40]=r63+1;break}else{break}}}while(0);r40=HEAP32[r9];HEAP32[r9]=r40+1;HEAP8[r3+(r40+32772)|0]=r49&255;r40=HEAP32[r20]+1|0;HEAP32[r20]=(r40|0)==(HEAP32[r22>>2]|0)?0:r40;r40=_i64Add(HEAP32[r2],HEAP32[r2+1],-1,-1);r45=tempRet0;HEAP32[r2]=r40;HEAP32[r2+1]=r45;r29=r45;r30=r40}}while(0);if(r4==561){r4=0;r29=HEAP32[r2+1];r30=HEAP32[r2]}r40=-1;if(!((r29|0)>(r40|0)|(r29|0)==(r40|0)&r30>>>0>-1>>>0)){r24=r11;r25=r10;break L770}}if(r4==626){return r5}else if(r4==629){return r5}}else{r24=r3+4227096|0;r25=r3+4227076|0}}while(0);do{if((HEAP32[r24>>2]|0)>=(HEAP32[r25>>2]+5|0)){if((HEAP32[r3+4249608>>2]|0)==0){if((_decode_number(r3,r3+4227520|0)|0)!=269){break}_read_tables20(r1,r3);break}else{if((_decode_number(r3,r3+(HEAP32[r3+4249600>>2]*1160&-1)+4250644|0)|0)!=256){break}_read_tables20(r1,r3);break}}}while(0);_unp_write_buf_old(r3);r5=1;return r5}function _read_tables20(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r3=STACKTOP;STACKTOP=STACKTOP+1056|0;r4=r3;r5=r3+24;r6=(r2+4227076|0)>>2;r7=(r2+4227096|0)>>2;do{if((HEAP32[r6]|0)>(HEAP32[r7]-25|0)){if((_unp_read_buf(r1,r2)|0)==0){r8=0}else{break}STACKTOP=r3;return r8}}while(0);r9=_getbits(r2);r10=(r2+4249608|0)>>2;HEAP32[r10]=r9&32768;if((r9&16384|0)==0){_memset(r2+4249616|0,0,1028)}_addbits(r2,2);if((HEAP32[r10]|0)==0){r11=374}else{r12=(r9>>>12&3)+1|0;r9=r2+4249612|0;HEAP32[r9>>2]=r12;r13=r2+4249600|0;if((HEAP32[r13>>2]|0)>=(r12|0)){HEAP32[r13>>2]=0}_addbits(r2,2);r11=HEAP32[r9>>2]*257&-1}r9=0;while(1){HEAP8[r4+r9|0]=_getbits(r2)>>>12&255;_addbits(r2,4);r13=r9+1|0;if((r13|0)<19){r9=r13}else{break}}r9=r2+4229664|0;_make_decode_tables(r4|0,r9,19);r4=HEAP32[r6];r13=HEAP32[r7];L877:do{if((r11|0)>0){r12=0;r14=r4;r15=r13;while(1){if((r14|0)>(r15-5|0)){if((_unp_read_buf(r1,r2)|0)==0){r8=0;break}}r16=_decode_number(r2,r9);do{if((r16|0)<16){HEAP8[r5+r12|0]=HEAPU8[r2+(r12+4249616)|0]+r16&15;r17=r12+1|0}else{if((r16|0)==16){r18=_getbits(r2);_addbits(r2,2);if((r12|0)>=(r11|0)){r17=r12;break}r19=r18>>>14;r18=r12-r11|0;r20=-3-r19|0;r21=((r20|0)>-1?-4-r20|0:-3)-r19|0;r20=r18>>>0>r21>>>0?r18:r21;r21=r19+3|0;r19=r12;while(1){r18=r21-1|0;HEAP8[r5+r19|0]=HEAP8[r5+(r19-1)|0];r22=r19+1|0;if((r18|0)>0&(r22|0)<(r11|0)){r21=r18;r19=r22}else{break}}r17=r12-r20|0;break}r19=_getbits(r2);if((r16|0)==17){_addbits(r2,3);r23=(r19>>>13)+3|0}else{_addbits(r2,7);r23=(r19>>>9)+11|0}if(!((r23|0)>0&(r12|0)<(r11|0))){r17=r12;break}r19=-r23|0;r21=r12-r11|0;r22=r21>>>0<r19>>>0?r19:r21;_memset(r5+r12|0,0,-r22|0);r17=r12-r22|0}}while(0);r16=HEAP32[r6];r22=HEAP32[r7];if((r17|0)<(r11|0)){r12=r17;r14=r16;r15=r22}else{r24=r16;r25=r22;break L877}}STACKTOP=r3;return r8}else{r24=r4;r25=r13}}while(0);if((r24|0)>(r25|0)){r8=1;STACKTOP=r3;return r8}if((HEAP32[r10]|0)==0){r10=r5|0;_make_decode_tables(r10,r2+4227520|0,298);_make_decode_tables(r5+298|0,r2+4228848|0,48);_make_decode_tables(r5+346|0,r2+4229420|0,28);r26=r10}else{r10=r2+4249612|0;if((HEAP32[r10>>2]|0)>0){r25=0;while(1){_make_decode_tables(r5+(r25*257&-1)|0,r2+(r25*1160&-1)+4250644|0,257);r24=r25+1|0;if((r24|0)<(HEAP32[r10>>2]|0)){r25=r24}else{break}}}r26=r5|0}r5=r2+4249616|0;_memcpy(r5,r26,1028)|0;r8=1;STACKTOP=r3;return r8}function _rarvm_set_value(r1,r2,r3){if((r1|0)==0){HEAP32[r2>>2]=r3;return}else{HEAP8[r2]=r3&255;return}}function _copy_string20(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=r1+4229892|0;r5=HEAP32[r4>>2];HEAP32[r4>>2]=r5+1;HEAP32[r1+((r5&3)<<2)+4229876>>2]=r3;HEAP32[r1+4229896>>2]=r3;HEAP32[r1+4229900>>2]=r2;r5=(r1+4249544|0)>>2;HEAP32[r5]=_i64Subtract(HEAP32[r5],HEAP32[r5+1],r2,0);HEAP32[r5+1]=tempRet0;r5=(r1+4227084|0)>>2;r4=HEAP32[r5];r6=r4-r3|0;if(!(r6>>>0<4194004&r4>>>0<4194004)){if((r2|0)==0){return}else{r7=r2;r8=r6;r9=r4}while(1){r3=r7-1|0;HEAP8[r1+(r9+32772)|0]=HEAP8[(r8&4194303)+r1+32772|0];r10=HEAP32[r5]+1&4194303;HEAP32[r5]=r10;if((r3|0)==0){break}else{r7=r3;r8=r8+1|0;r9=r10}}return}r9=HEAP8[r1+(r6+32772)|0];HEAP32[r5]=r4+1;HEAP8[r1+(r4+32772)|0]=r9;r9=HEAP8[r1+(r6+32773)|0];r4=HEAP32[r5];HEAP32[r5]=r4+1;HEAP8[r1+(r4+32772)|0]=r9;if(r2>>>0<=2){return}r9=r2;r2=r6+2|0;while(1){r6=r9-1|0;r4=HEAP8[r1+(r2+32772)|0];r8=HEAP32[r5];HEAP32[r5]=r8+1;HEAP8[r1+(r8+32772)|0]=r4;if(r6>>>0>2){r9=r6;r2=r2+1|0}else{break}}return}function _rar_crc(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;if((r3|0)==0){r5=r1;return r5}else{r6=r1;r7=r3;r8=r2}while(1){if((r8&7|0)==0){break}r2=HEAP32[((HEAPU8[r8]^r6&255)<<2)+2624>>2]^r6>>>8;r3=r7-1|0;if((r3|0)==0){r5=r2;r4=694;break}else{r6=r2;r7=r3;r8=r8+1|0}}if(r4==694){return r5}if(r7>>>0>7){r4=r6;r3=r7;r2=r8;while(1){r1=HEAP32[r2>>2]^r4;r9=r1>>>8^HEAP32[((r1&255)<<2)+2624>>2];r1=r9>>>8^HEAP32[((r9&255)<<2)+2624>>2];r9=r1>>>8^HEAP32[((r1&255)<<2)+2624>>2];r1=HEAP32[r2+4>>2]^HEAP32[((r9&255)<<2)+2624>>2]^r9>>>8;r9=r1>>>8^HEAP32[((r1&255)<<2)+2624>>2];r1=r9>>>8^HEAP32[((r9&255)<<2)+2624>>2];r9=r1>>>8^HEAP32[((r1&255)<<2)+2624>>2];r1=r9>>>8^HEAP32[((r9&255)<<2)+2624>>2];r9=r2+8|0;r10=r3-8|0;if(r10>>>0>7){r4=r1;r3=r10;r2=r9}else{r11=r1;r12=r10;r13=r9;break}}}else{r11=r6;r12=r7;r13=r8}if((r12|0)==0){r5=r11;return r5}else{r14=r11;r15=0}while(1){r11=HEAP32[((HEAPU8[r13+r15|0]^r14&255)<<2)+2624>>2]^r14>>>8;r8=r15+1|0;if(r8>>>0<r12>>>0){r14=r11;r15=r8}else{r5=r11;break}}return r5}function _rarvm_addbits(r1,r2){var r3,r4;r3=r1+12|0;r4=HEAP32[r3>>2]+r2|0;r2=r1+8|0;HEAP32[r2>>2]=(r4>>3)+HEAP32[r2>>2];HEAP32[r3>>2]=r4&7;return}function _rarvm_getbits(r1){var r2,r3;r2=HEAP32[r1+8>>2];r3=HEAP32[r1>>2];return(HEAPU8[r2+(r3+1)|0]<<8|HEAPU8[r3+r2|0]<<16|HEAPU8[r2+(r3+2)|0])>>>((8-HEAP32[r1+12>>2]|0)>>>0)&65535}function _rarvm_read_data(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=(r1+8|0)>>2;r3=HEAP32[r2];r4=HEAP32[r1>>2];r5=(r1+12|0)>>2;r1=HEAP32[r5];r6=(HEAPU8[r3+(r4+1)|0]<<8|HEAPU8[r4+r3|0]<<16|HEAPU8[r3+(r4+2)|0])>>>((8-r1|0)>>>0);r7=r6&49152;if((r7|0)==16384){if((r6&15360|0)==0){r8=r1+14|0;HEAP32[r2]=(r8>>3)+r3;HEAP32[r5]=r8&7;r9=r6>>>2|-256;return r9}else{r8=r1+10|0;HEAP32[r2]=(r8>>3)+r3;HEAP32[r5]=r8&7;r9=r6>>>6&255;return r9}}else if((r7|0)==32768){r8=r1+2|0;r10=(r8>>3)+r3|0;HEAP32[r2]=r10;r11=r8&7;HEAP32[r5]=r11;r8=r10+2|0;r12=(HEAPU8[r10+(r4+1)|0]<<8|HEAPU8[r4+r10|0]<<16|HEAPU8[r4+r8|0])>>>((8-r11|0)>>>0)&65535;HEAP32[r2]=r8;HEAP32[r5]=r11;r9=r12;return r9}else if((r7|0)==0){r7=r1+6|0;HEAP32[r2]=(r7>>3)+r3;HEAP32[r5]=r7&7;r9=r6>>>10&15;return r9}else{r6=r1+2|0;r1=(r6>>3)+r3|0;HEAP32[r2]=r1;r3=r6&7;HEAP32[r5]=r3;r6=r1+2|0;r7=r4+r6|0;r12=8-r3|0;r11=(HEAPU8[r1+(r4+1)|0]<<8|HEAPU8[r4+r1|0]<<16|HEAPU8[r7])>>>(r12>>>0)<<16;HEAP32[r2]=r6;HEAP32[r5]=r3;r6=r1+4|0;r8=(HEAPU8[r1+(r4+3)|0]<<8|HEAPU8[r7]<<16|HEAPU8[r4+r6|0])>>>(r12>>>0)&65535|r11;HEAP32[r2]=r6;HEAP32[r5]=r3;r9=r8;return r9}}function _rar_filter_array_reset(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;if((r1|0)==0){return}r2=(r1+4|0)>>2;r3=HEAP32[r2];r4=(r1|0)>>2;r1=HEAP32[r4];if((r3|0)==0){r5=r1}else{r6=0;r7=r1;r1=r3;while(1){r3=HEAP32[r7+(r6<<2)>>2];if((r3|0)==0){r8=r1;r9=r7}else{r10=HEAP32[r3+32>>2];if((r10|0)!=0){_free(r10)}r10=HEAP32[r3+36>>2];if((r10|0)!=0){_free(r10)}_rar_cmd_array_reset(r3+16|0);_free(r3);r8=HEAP32[r2];r9=HEAP32[r4]}r3=r6+1|0;if(r3>>>0<r8>>>0){r6=r3;r7=r9;r1=r8}else{r5=r9;break}}}if((r5|0)!=0){_free(r5)}HEAP32[r4]=0;HEAP32[r2]=0;return}function _rar_filter_delete(r1){var r2;if((r1|0)==0){return}r2=HEAP32[r1+32>>2];if((r2|0)!=0){_free(r2)}r2=HEAP32[r1+36>>2];if((r2|0)!=0){_free(r2)}_rar_cmd_array_reset(r1+16|0);_free(r1);return}function _rar_filter_array_add(r1,r2){var r3,r4,r5;r3=(r1+4|0)>>2;r4=HEAP32[r3]+r2|0;HEAP32[r3]=r4;r2=r1|0;r1=_realloc(HEAP32[r2>>2],r4<<2);r4=r1;HEAP32[r2>>2]=r4;if((r1|0)==0){HEAP32[r3]=0;r5=0;return r5}else{HEAP32[r4+(HEAP32[r3]-1<<2)>>2]=0;r5=1;return r5}}function _rar_filter_new(){var r1,r2,r3,r4;r1=_malloc(84),r2=r1>>2;if((r1|0)==0){r3=0;return r3}HEAP32[r2]=0;HEAP32[r2+1]=0;HEAP32[r2+2]=0;HEAP32[r2+3]=0;_rar_cmd_array_init(r1+16|0);r4=(r1+32|0)>>2;HEAP32[r2+19]=0;HEAP32[r2+20]=0;HEAP32[r4]=0;HEAP32[r4+1]=0;HEAP32[r4+2]=0;HEAP32[r4+3]=0;r3=r1;return r3}function _rarvm_init(r1){var r2,r3,r4,r5;r2=r1|0;HEAP32[r2>>2]=_malloc(262148);r1=0;while(1){r3=r1>>>1;r4=(r1&1|0)!=0?r3^-306674912:r3;r3=r4>>>1;r5=(r4&1|0)!=0?r3^-306674912:r3;r3=r5>>>1;r4=(r5&1|0)!=0?r3^-306674912:r3;r3=r4>>>1;r5=(r4&1|0)!=0?r3^-306674912:r3;r3=r5>>>1;r4=(r5&1|0)!=0?r3^-306674912:r3;r3=r4>>>1;r5=(r4&1|0)!=0?r3^-306674912:r3;r3=r5>>>1;r4=(r5&1|0)!=0?r3^-306674912:r3;r3=r4>>>1;HEAP32[(r1<<2)+2624>>2]=(r4&1|0)!=0?r3^-306674912:r3;r3=r1+1|0;if((r3|0)<256){r1=r3}else{break}}return(HEAP32[r2>>2]|0)!=0|0}function _rarvm_set_memory(r1,r2,r3,r4){var r5;if(r2>>>0>=262144){return}r5=HEAP32[r1>>2]+r2|0;if((r5|0)==(r3|0)){return}r1=262144-r2|0;_memmove(r5,r3,r1>>>0>r4>>>0?r4:r1,1,0);return}function _rarvm_execute(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137;r3=r2>>2;r4=0;r5=(r1+4|0)>>2;r6=(r2+32|0)>>2;HEAP32[r5]=HEAP32[r6];HEAP32[r5+1]=HEAP32[r6+1];HEAP32[r5+2]=HEAP32[r6+2];HEAP32[r5+3]=HEAP32[r6+3];HEAP32[r5+4]=HEAP32[r6+4];HEAP32[r5+5]=HEAP32[r6+5];HEAP32[r5+6]=HEAP32[r6+6];r6=(r2+24|0)>>2;r5=HEAP32[r6];r7=(r5|0)<8192?r5:8192;if((r7|0)!=0){r5=HEAP32[r1>>2]+245760|0;r8=HEAP32[r3+4];_memcpy(r5,r8,r7)|0}r8=HEAP32[r3+7];r5=8192-r7|0;r9=r8>>>0<r5>>>0?r8:r5;if((r9|0)!=0){r5=HEAP32[r1>>2]+r7+245760|0;r7=HEAP32[r3+5];_memcpy(r5,r7,r9)|0}r9=(r1+32|0)>>2;HEAP32[r9]=262144;r7=(r1+36|0)>>2;HEAP32[r7]=0;r5=HEAP32[r3+2];do{if((r5|0)==0){r8=HEAP32[r3];if((r8|0)==0){r10=0}else{r11=r8;break}return r10}else{r11=r5}}while(0);r5=HEAP32[r3+3];r8=r11+(r5*40&-1)|0;r12=(r1|0)>>2;L1034:do{if((r5|0)<0){r4=1021}else{r13=r11;r14=(r1+20|0)>>2;r15=(r1+28|0)>>2;r16=(r1+4|0)>>2;r17=(r1+8|0)>>2;r18=r1+12|0;r19=r1+16|0;r20=r1+24|0;r21=r11,r22=r21>>2;r23=25e6;while(1){r24=HEAP32[r22+5];if((HEAP32[r22+2]|0)==2){r25=HEAP32[r12]+(HEAP32[r22+4]+HEAP32[r24>>2]&262143)|0,r26=r25>>2}else{r25=r24,r26=r25>>2}r24=HEAP32[r22+9];if((HEAP32[r22+6]|0)==2){r27=HEAP32[r12]+(HEAP32[r22+8]+HEAP32[r24>>2]&262143)|0,r28=r27>>2}else{r27=r24,r28=r27>>2}r24=HEAP32[r22];do{if((r24|0)==15){if((HEAP32[r7]&1|0)==0){r4=1020;break}r29=HEAP32[r26];if(r29>>>0>=r5>>>0){break L1034}if((r23|0)<2){r4=1021;break L1034}r30=r11+(r29*40&-1)|0}else if((r24|0)==16){if((HEAP32[r7]&3|0)==0){r4=1020;break}r29=HEAP32[r26];if(r29>>>0>=r5>>>0){break L1034}if((r23|0)<2){r4=1021;break L1034}r30=r11+(r29*40&-1)|0}else if((r24|0)==17){if((HEAP32[r7]&3|0)!=0){r4=1020;break}r29=HEAP32[r26];if(r29>>>0>=r5>>>0){break L1034}if((r23|0)<2){r4=1021;break L1034}r30=r11+(r29*40&-1)|0}else if((r24|0)==18){if((HEAP32[r7]&1|0)!=0){r4=1020;break}r29=HEAP32[r26];if(r29>>>0>=r5>>>0){break L1034}if((r23|0)<2){r4=1021;break L1034}r30=r11+(r29*40&-1)|0}else if((r24|0)==7){if((HEAP32[r22+1]|0)==0){r29=HEAP32[r26]-1|0;HEAP32[r26]=r29;r31=r29}else{r29=r25;r32=HEAPU8[r29]-1|0;HEAP8[r29]=r32&255;r31=r32}HEAP32[r7]=(r31|0)==0?2:r31&-2147483648;r4=1020}else if((r24|0)==50){r32=r25;HEAP8[r32]=HEAP8[r32]-1&255;r4=1020}else if((r24|0)==51){HEAP32[r26]=HEAP32[r26]-1;r4=1020}else if((r24|0)==8){r32=HEAP32[r26];if(r32>>>0>=r5>>>0){break L1034}if((r23|0)<2){r4=1021;break L1034}r30=r11+(r32*40&-1)|0}else if((r24|0)==45){HEAP32[r26]=HEAP32[r28]+HEAP32[r26];r4=1020}else if((r24|0)==3){r32=r21+4|0;if((HEAP32[r32>>2]|0)==0){r33=HEAP32[r28];r34=HEAP32[r26]}else{r33=HEAPU8[r27];r34=HEAPU8[r25]}r29=r34-r33|0;if((r34|0)==(r33|0)){r35=2}else{r35=r29>>>0>r34>>>0|r29&-2147483648}HEAP32[r7]=r35;if((HEAP32[r32>>2]|0)==0){HEAP32[r26]=r29;r4=1020;break}else{HEAP8[r25]=r29&255;r4=1020;break}}else if((r24|0)==42){r29=HEAP8[r25];r32=r29&255;r36=HEAP8[r27];r37=r32-(r36&255)|0;if(r29<<24>>24==r36<<24>>24){r38=2}else{r38=r37>>>0>r32>>>0|r37&-2147483648}HEAP32[r7]=r38;r4=1020}else if((r24|0)==43){r37=HEAP32[r26];r32=HEAP32[r28];r36=r37-r32|0;if((r37|0)==(r32|0)){r39=2}else{r39=r36>>>0>r37>>>0|r36&-2147483648}HEAP32[r7]=r39;r4=1020}else if((r24|0)==25){r36=r21+4|0;if((HEAP32[r36>>2]|0)==0){r40=HEAP32[r26]}else{r40=HEAPU8[r25]}r37=r40>>>(r40>>>0);HEAP32[r7]=((r37|0)==0?2:r37&-2147483648)|r40>>>((r40-1|0)>>>0)&1;if((HEAP32[r36>>2]|0)==0){HEAP32[r26]=r37;r4=1020;break}else{HEAP8[r25]=r37&255;r4=1020;break}}else if((r24|0)==26){r37=r21+4|0;if((HEAP32[r37>>2]|0)==0){r41=HEAP32[r26]}else{r41=HEAPU8[r25]}r36=r41>>r41;HEAP32[r7]=((r36|0)==0?2:r36&-2147483648)|r41>>>((r41-1|0)>>>0)&1;if((HEAP32[r37>>2]|0)==0){HEAP32[r26]=r36;r4=1020;break}else{HEAP8[r25]=r36&255;r4=1020;break}}else if((r24|0)==12){if((HEAP32[r22+1]|0)==0){r42=HEAP32[r28];r43=HEAP32[r26]}else{r42=HEAPU8[r27];r43=HEAPU8[r25]}r36=r42&r43;HEAP32[r7]=(r36|0)==0?2:r36&-2147483648;r4=1020}else if((r24|0)==13){if((HEAP32[r7]|0)>=0){r4=1020;break}r36=HEAP32[r26];if(r36>>>0>=r5>>>0){break L1034}if((r23|0)<2){r4=1021;break L1034}r30=r11+(r36*40&-1)|0}else if((r24|0)==14){if((HEAP32[r7]|0)<=-1){r4=1020;break}r36=HEAP32[r26];if(r36>>>0>=r5>>>0){break L1034}if((r23|0)<2){r4=1021;break L1034}r30=r11+(r36*40&-1)|0}else if((r24|0)==46){r36=r25;HEAP8[r36]=HEAP8[r36]-HEAP8[r27]&255;r4=1020}else if((r24|0)==47){HEAP32[r26]=HEAP32[r26]-HEAP32[r28];r4=1020}else if((r24|0)==4){if((HEAP32[r7]&2|0)==0){r4=1020;break}r36=HEAP32[r26];if(r36>>>0>=r5>>>0){break L1034}if((r23|0)<2){r4=1021;break L1034}r30=r11+(r36*40&-1)|0}else if((r24|0)==40){HEAP8[r25]=HEAP8[r27];r4=1020}else if((r24|0)==41){HEAP32[r26]=HEAP32[r28];r4=1020}else if((r24|0)==1){if((HEAP32[r22+1]|0)==0){r44=HEAP32[r28];r45=HEAP32[r26]}else{r44=HEAPU8[r27];r45=HEAPU8[r25]}r36=r45-r44|0;if((r45|0)==(r44|0)){r46=2}else{r46=r36>>>0>r45>>>0|r36&-2147483648}HEAP32[r7]=r46;r4=1020}else if((r24|0)==35){if((HEAP32[r22+1]|0)==0){HEAP32[r26]=Math.imul(HEAP32[r28],HEAP32[r26])|0;r4=1020;break}else{r36=r25;HEAP8[r36]=HEAP8[r27]*HEAP8[r36]&255;r4=1020;break}}else if((r24|0)==36){r36=(HEAP32[r22+1]|0)==0;if(r36){r47=HEAP32[r28]}else{r47=HEAPU8[r27]}if((r47|0)==0){r4=1020;break}if(r36){HEAP32[r26]=(HEAP32[r26]>>>0)/(r47>>>0)&-1;r4=1020;break}else{r36=r25;HEAP8[r36]=(HEAPU8[r36]>>>0)/(r47>>>0)&-1&255;r4=1020;break}}else if((r24|0)==37){r36=r21+4|0;if((HEAP32[r36>>2]|0)==0){r48=HEAP32[r28];r49=HEAP32[r26]}else{r48=HEAPU8[r27];r49=HEAPU8[r25]}r37=HEAP32[r7]&1;r32=r48+r49+r37|0;if((r32|0)==0){r50=2}else{if(r32>>>0<r49>>>0){r51=1}else{r51=(r32|0)==(r49|0)?r37:0}r50=r51|r32&-2147483648}HEAP32[r7]=r50;if((HEAP32[r36>>2]|0)==0){HEAP32[r26]=r32;r4=1020;break}else{HEAP8[r25]=r32&255;r4=1020;break}}else if((r24|0)==38){r32=r21+4|0;if((HEAP32[r32>>2]|0)==0){r52=HEAP32[r28];r53=HEAP32[r26]}else{r52=HEAPU8[r27];r53=HEAPU8[r25]}r36=HEAP32[r7]&1;r37=r53-r52|0;r29=r37-r36|0;if((r37|0)==(r36|0)){r54=2}else{if(r29>>>0>r53>>>0){r55=1}else{r55=(r29|0)==(r53|0)?r36:0}r54=r55|r29&-2147483648}HEAP32[r7]=r54;if((HEAP32[r32>>2]|0)==0){HEAP32[r26]=r29;r4=1020;break}else{HEAP8[r25]=r29&255;r4=1020;break}}else if((r24|0)==9){r29=r21+4|0;if((HEAP32[r29>>2]|0)==0){r56=HEAP32[r28];r57=HEAP32[r26]}else{r56=HEAPU8[r27];r57=HEAPU8[r25]}r32=r56^r57;HEAP32[r7]=(r57|0)==(r56|0)?2:r32&-2147483648;if((HEAP32[r29>>2]|0)==0){HEAP32[r26]=r32;r4=1020;break}else{HEAP8[r25]=r32&255;r4=1020;break}}else if((r24|0)==10){r32=r21+4|0;if((HEAP32[r32>>2]|0)==0){r58=HEAP32[r28];r59=HEAP32[r26]}else{r58=HEAPU8[r27];r59=HEAPU8[r25]}r29=r58&r59;HEAP32[r7]=(r29|0)==0?2:r29&-2147483648;if((HEAP32[r32>>2]|0)==0){HEAP32[r26]=r29;r4=1020;break}else{HEAP8[r25]=r29&255;r4=1020;break}}else if((r24|0)==11){r29=r21+4|0;if((HEAP32[r29>>2]|0)==0){r60=HEAP32[r28];r61=HEAP32[r26]}else{r60=HEAPU8[r27];r61=HEAPU8[r25]}r32=r60|r61;HEAP32[r7]=(r32|0)==0?2:r32&-2147483648;if((HEAP32[r29>>2]|0)==0){HEAP32[r26]=r32;r4=1020;break}else{HEAP8[r25]=r32&255;r4=1020;break}}else if((r24|0)==27){r32=r21+4|0;if((HEAP32[r32>>2]|0)==0){r62=HEAP32[r26]}else{r62=HEAPU8[r25]}r29=-r62|0;if((r62|0)==0){r63=2}else{r63=r29&-2147483648|1}HEAP32[r7]=r63;if((HEAP32[r32>>2]|0)==0){HEAP32[r26]=r29;r4=1020;break}else{HEAP8[r25]=r29&255;r4=1020;break}}else if((r24|0)==52){r29=r25;HEAP8[r29]=-HEAP8[r29]&255;r4=1020}else if((r24|0)==53){HEAP32[r26]=-HEAP32[r26];r4=1020}else if((r24|0)==28){r29=HEAP32[r9];HEAP32[HEAP32[r12]+(r29+262140&262143)>>2]=HEAP32[r16];HEAP32[HEAP32[r12]+(r29+262136&262143)>>2]=HEAP32[r17];HEAP32[HEAP32[r12]+(r29+262132&262143)>>2]=HEAP32[r18>>2];HEAP32[HEAP32[r12]+(r29+262128&262143)>>2]=HEAP32[r19>>2];HEAP32[HEAP32[r12]+(r29+262124&262143)>>2]=HEAP32[r14];HEAP32[HEAP32[r12]+(r29+262120&262143)>>2]=HEAP32[r20>>2];HEAP32[HEAP32[r12]+(r29+262116&262143)>>2]=HEAP32[r15];HEAP32[HEAP32[r12]+(r29+262112&262143)>>2]=HEAP32[r9];HEAP32[r9]=HEAP32[r9]-32;r4=1020}else if((r24|0)==29){r29=HEAP32[r9];r32=HEAP32[r12]>>2;HEAP32[r9]=HEAP32[((r29&262143)>>2)+r32];HEAP32[r15]=HEAP32[((r29+4&262143)>>2)+r32];HEAP32[r20>>2]=HEAP32[((r29+8&262143)>>2)+r32];HEAP32[r14]=HEAP32[((r29+12&262143)>>2)+r32];HEAP32[r19>>2]=HEAP32[((r29+16&262143)>>2)+r32];HEAP32[r18>>2]=HEAP32[((r29+20&262143)>>2)+r32];HEAP32[r17]=HEAP32[((r29+24&262143)>>2)+r32];HEAP32[r16]=HEAP32[((r29+28&262143)>>2)+r32];r4=1020}else if((r24|0)==30){r32=HEAP32[r9]-4|0;HEAP32[r9]=r32;HEAP32[HEAP32[r12]+(r32&262143)>>2]=HEAP32[r7];r4=1020}else if((r24|0)==31){r32=HEAP32[r9];HEAP32[r7]=HEAP32[HEAP32[r12]+(r32&262143)>>2];HEAP32[r9]=r32+4;r4=1020}else if((r24|0)==32){HEAP32[r26]=HEAPU8[r27];r4=1020}else if((r24|0)==33){HEAP32[r26]=HEAP8[r27]|0;r4=1020}else if((r24|0)==34){r32=r21+4|0;if((HEAP32[r32>>2]|0)==0){r29=HEAP32[r26];HEAP32[r26]=HEAP32[r28];r64=r29}else{r29=r25;r36=HEAPU8[r29];HEAP8[r29]=HEAP8[r27];r64=r36}if((HEAP32[r32>>2]|0)==0){HEAP32[r28]=r64;r4=1020;break}else{HEAP8[r27]=r64&255;r4=1020;break}}else if((r24|0)==44){r32=r25;HEAP8[r32]=HEAP8[r27]+HEAP8[r32]&255;r4=1020}else if((r24|0)==0){if((HEAP32[r22+1]|0)==0){HEAP32[r26]=HEAP32[r28];r4=1020;break}else{HEAP8[r25]=HEAP8[r27];r4=1020;break}}else if((r24|0)==19){r32=HEAP32[r9]-4|0;HEAP32[r9]=r32;HEAP32[HEAP32[r12]+(r32&262143)>>2]=HEAP32[r26];r4=1020}else if((r24|0)==20){HEAP32[r26]=HEAP32[HEAP32[r12]+(HEAP32[r9]&262143)>>2];HEAP32[r9]=HEAP32[r9]+4;r4=1020}else if((r24|0)==21){r32=HEAP32[r9]-4|0;HEAP32[r9]=r32;HEAP32[HEAP32[r12]+(r32&262143)>>2]=((r21-r13|0)/40&-1)+1;r32=HEAP32[r26];if(r32>>>0>=r5>>>0){break L1034}if((r23|0)<2){r4=1021;break L1034}r30=r11+(r32*40&-1)|0}else if((r24|0)==23){if((HEAP32[r22+1]|0)==0){HEAP32[r26]=~HEAP32[r26];r4=1020;break}else{r32=r25;HEAP8[r32]=~HEAP8[r32];r4=1020;break}}else if((r24|0)==24){r32=r21+4|0;if((HEAP32[r32>>2]|0)==0){r65=HEAP32[r26]}else{r65=HEAPU8[r25]}r36=r65<<r65;HEAP32[r7]=(-2147483648>>>((r65-1|0)>>>0)&r65|0)!=0|((r36|0)==0?2:r36&-2147483648);if((HEAP32[r32>>2]|0)==0){HEAP32[r26]=r36;r4=1020;break}else{HEAP8[r25]=r36&255;r4=1020;break}}else if((r24|0)==6){if((HEAP32[r22+1]|0)==0){r36=HEAP32[r26]+1|0;HEAP32[r26]=r36;r66=r36}else{r36=r25;r32=HEAPU8[r36]+1|0;HEAP8[r36]=r32&255;r66=r32}HEAP32[r7]=(r66|0)==0?2:r66&-2147483648;r4=1020}else if((r24|0)==48){r32=r25;HEAP8[r32]=HEAP8[r32]+1&255;r4=1020}else if((r24|0)==49){HEAP32[r26]=HEAP32[r26]+1;r4=1020}else if((r24|0)==22){r32=HEAP32[r9];if(r32>>>0>262143){break L1034}r36=HEAP32[HEAP32[r12]+(r32&262143)>>2];if(r36>>>0>=r5>>>0){break L1034}if((r23|0)<2){r4=1021;break L1034}HEAP32[r9]=r32+4;r30=r11+(r36*40&-1)|0}else if((r24|0)==54){r36=HEAP32[r22+3];if((r36|0)==1|(r36|0)==2){r32=HEAP32[r15];r29=HEAP32[r14]-4|0;if(r29>>>0>245755|(r29|0)==0){r4=1020;break}r37=(r36|0)==2?233:232;r67=0;r68=HEAP32[r12];while(1){r69=r68+1|0;r70=HEAP8[r68];r71=r67+1|0;if(r70<<24>>24==-24|(r70&255|0)==(r37|0)){r70=r71+r32|0;r72=r69>>2;r73=HEAP32[r72];do{if((r73|0)<0){if((r73+r70|0)<=-1){break}HEAP32[r72]=r73+16777216}else{if((r73|0)>=16777216){break}HEAP32[r72]=r73-r70}}while(0);r74=r68+5|0;r75=r67+5|0}else{r74=r69;r75=r71}if(r75>>>0<r29>>>0){r67=r75;r68=r74}else{r4=1020;break}}}else if((r36|0)==3){r68=HEAP32[r14]-21|0;if(r68>>>0>245738|(r68|0)==0){r4=1020;break}r67=HEAP32[r15]>>>4;r29=0;r32=HEAP32[r12];while(1){r37=(HEAP8[r32]&31)-16|0;do{if((r37|0)>-1){r70=HEAPU8[r37+1504|0];if((13263>>>(r37>>>0)&1|0)==0){break}else{r76=0}while(1){do{if((1<<r76&r70|0)!=0){r73=r76*41&-1;r72=r73+42|0;r77=(r72|0)/8&-1;if(((HEAPU8[r77+(r32+1)|0]<<8|HEAPU8[r32+r77|0]|HEAPU8[r77+(r32+2)|0]<<16|HEAPU8[r77+(r32+3)|0]<<24)>>>((r72&7)>>>0)&15|0)!=5){break}r72=r73+18|0;r73=(r72|0)/8&-1;r77=r72&7;r72=r32+r73|0;r78=HEAPU8[r72];r79=r73+(r32+1)|0;r80=HEAPU8[r79];r81=r73+(r32+2)|0;r82=HEAPU8[r81];r83=r73+(r32+3)|0;r73=HEAPU8[r83];r84=~(1048575<<r77);r85=(((r80<<8|r78|r82<<16|r73<<24)>>>(r77>>>0))-r67&1048575)<<r77;HEAP8[r72]=(r85|r78&r84)&255;HEAP8[r79]=(r85>>>8|r80&r84>>>8)&255;HEAP8[r81]=(r85>>>16|r82&r84>>>16)&255;HEAP8[r83]=(r85>>>24|r73&r84>>>24)&255}}while(0);r84=r76+1|0;if((r84|0)<3){r76=r84}else{break}}}}while(0);r37=r29+16|0;if(r37>>>0<r68>>>0){r67=r67+1|0;r29=r37;r32=r32+16|0}else{r4=1020;break}}}else if((r36|0)==6){r32=HEAP32[r14];r29=HEAP32[r16];r67=r32<<1;HEAP32[HEAP32[r12]+245792>>2]=r32;if((r32|0)<122880&(r29|0)>0){r86=0;r87=0}else{r4=1020;break}while(1){r68=r86+r32|0;if((r68|0)<(r67|0)){r37=r68;r68=0;r71=r87;while(1){r69=r71+1|0;r70=HEAP32[r12];r84=r68-HEAP8[r70+r71|0]&255;HEAP8[r70+r37|0]=r84;r70=r37+r29|0;if((r70|0)<(r67|0)){r37=r70;r68=r84;r71=r69}else{r88=r69;break}}}else{r88=r87}r71=r86+1|0;if((r71|0)<(r29|0)){r86=r71;r87=r88}else{r4=1020;break}}}else if((r36|0)==4){r29=HEAP32[r14];r67=HEAP32[r16];r32=HEAP32[r17];r71=HEAP32[r12];HEAP32[r71+245792>>2]=r29;if((r29|0)>122879){r4=1020;break}r68=3-r67|0;do{if((r29|0)>0){r67=0;r37=0;r69=r71;while(1){r84=r37+r68|0;do{if((r84|0)>2){r70=r84+r29|0;r73=HEAPU8[r71+r70|0];r85=HEAPU8[r71+(r70-3)|0];r70=r73+r67-r85|0;r83=r70-r67|0;r82=(r83|0)>-1?r83:-r83|0;r83=r70-r73|0;r81=(r83|0)>-1?r83:-r83|0;r83=r70-r85|0;r70=(r83|0)>-1?r83:-r83|0;if(!((r82|0)>(r81|0)|(r82|0)>(r70|0))){r89=r67;break}r89=(r81|0)>(r70|0)?r85:r73}else{r89=r67}}while(0);r90=r69+1|0;r84=r89-HEAPU8[r69]|0;HEAP8[r71+r37+r29|0]=r84&255;r73=r37+3|0;if((r73|0)<(r29|0)){r67=r84&255;r37=r73;r69=r90}else{break}}if((r29|0)>1){r91=0;r92=1;r93=r90}else{break}while(1){r69=r92+r68|0;do{if((r69|0)>2){r37=r69+r29|0;r67=HEAPU8[r71+r37|0];r73=HEAPU8[r71+(r37-3)|0];r37=r67+r91-r73|0;r84=r37-r91|0;r85=(r84|0)>-1?r84:-r84|0;r84=r37-r67|0;r70=(r84|0)>-1?r84:-r84|0;r84=r37-r73|0;r37=(r84|0)>-1?r84:-r84|0;if(!((r85|0)>(r70|0)|(r85|0)>(r37|0))){r94=r91;break}r94=(r70|0)>(r37|0)?r73:r67}else{r94=r91}}while(0);r95=r93+1|0;r69=r94-HEAPU8[r93]|0;HEAP8[r71+r92+r29|0]=r69&255;r67=r92+3|0;if((r67|0)<(r29|0)){r91=r69&255;r92=r67;r93=r95}else{break}}if((r29|0)>2){r96=0;r97=2;r98=r95}else{break}while(1){r67=r97+r68|0;do{if((r67|0)>2){r69=r67+r29|0;r73=HEAPU8[r71+r69|0];r37=HEAPU8[r71+(r69-3)|0];r69=r73+r96-r37|0;r70=r69-r96|0;r85=(r70|0)>-1?r70:-r70|0;r70=r69-r73|0;r84=(r70|0)>-1?r70:-r70|0;r70=r69-r37|0;r69=(r70|0)>-1?r70:-r70|0;if(!((r85|0)>(r84|0)|(r85|0)>(r69|0))){r99=r96;break}r99=(r84|0)>(r69|0)?r37:r73}else{r99=r96}}while(0);r67=r99-HEAPU8[r98]|0;HEAP8[r71+r97+r29|0]=r67&255;r73=r97+3|0;if((r73|0)<(r29|0)){r96=r67&255;r97=r73;r98=r98+1|0}else{break}}}}while(0);r68=r29-2|0;if((r32|0)>=(r68|0)){r4=1020;break}r73=r29+1|0;r67=r29+2|0;r37=r32;while(1){r69=HEAP8[r71+r73+r37|0];r84=r71+r37+r29|0;HEAP8[r84]=HEAP8[r84]+r69&255;r84=r71+r67+r37|0;HEAP8[r84]=HEAP8[r84]+r69&255;r69=r37+3|0;if((r69|0)<(r68|0)){r37=r69}else{r4=1020;break}}}else if((r36|0)==5){r37=HEAP32[r16];r68=HEAP32[r14];r67=HEAP32[r12];HEAP32[r67+245792>>2]=r68;if((r68|0)<122880&(r37|0)>0){r100=0;r101=r67}else{r4=1020;break}while(1){if((r100|0)<(r68|0)){r71=0;r29=r100;r73=r101;r32=0;r69=0;r84=0;r85=0;r70=0;r81=0;r82=0;r83=0;r80=0;r79=0;r78=0;r72=0;r77=0;r102=0;while(1){r103=r69-r84|0;r104=Math.imul(r69,r70)|0;r105=((Math.imul(r103,r81)|0)+((r32<<3)+r104+Math.imul(r85,r82))|0)>>>3&255;r104=r73+1|0;r106=HEAP8[r73];r107=r105-(r106&255)|0;HEAP8[r67+r29+r68|0]=r107&255;r105=r107-r32<<24>>24;r108=r106<<24>>24<<3;r109=(r106<<24>>24>-1?r108:-r108|0)+r83|0;r106=r108-r69|0;r110=((r106|0)>-1?r106:-r106|0)+r80|0;r106=r108+r69|0;r111=((r106|0)>-1?r106:-r106|0)+r79|0;r106=r108-r103|0;r112=((r106|0)>-1?r106:-r106|0)+r78|0;r106=r108+r103|0;r113=((r106|0)>-1?r106:-r106|0)+r72|0;r106=r108-r85|0;r114=((r106|0)>-1?r106:-r106|0)+r77|0;r106=r108+r85|0;r108=((r106|0)>-1?r106:-r106|0)+r102|0;do{if((r71&31|0)==0){r106=r110>>>0<r109>>>0;r115=r106?r110:r109;r116=r111>>>0<r115>>>0;r117=r116?r111:r115;r115=r112>>>0<r117>>>0;r118=r115?r112:r117;r117=r113>>>0<r118>>>0;r119=r117?r113:r118;r118=r114>>>0<r119>>>0;r120=r108>>>0<(r118?r114:r119)>>>0?6:r118?5:r117?4:r115?3:r116?2:r106&1;if((r120|0)==1){r121=r82;r122=r81;r123=(((r70|0)>-17)<<31>>31)+r70|0;r124=0;r125=0;r126=0;r127=0;r128=0;r129=0;r130=0;break}else if((r120|0)==2){r121=r82;r122=r81;r123=((r70|0)<16)+r70|0;r124=0;r125=0;r126=0;r127=0;r128=0;r129=0;r130=0;break}else if((r120|0)==3){r121=r82;r122=(((r81|0)>-17)<<31>>31)+r81|0;r123=r70;r124=0;r125=0;r126=0;r127=0;r128=0;r129=0;r130=0;break}else if((r120|0)==4){r121=r82;r122=((r81|0)<16)+r81|0;r123=r70;r124=0;r125=0;r126=0;r127=0;r128=0;r129=0;r130=0;break}else if((r120|0)==5){r121=(((r82|0)>-17)<<31>>31)+r82|0;r122=r81;r123=r70;r124=0;r125=0;r126=0;r127=0;r128=0;r129=0;r130=0;break}else if((r120|0)==6){r121=((r82|0)<16)+r82|0;r122=r81;r123=r70;r124=0;r125=0;r126=0;r127=0;r128=0;r129=0;r130=0;break}else{r121=r82;r122=r81;r123=r70;r124=0;r125=0;r126=0;r127=0;r128=0;r129=0;r130=0;break}}else{r121=r82;r122=r81;r123=r70;r124=r109;r125=r110;r126=r111;r127=r112;r128=r113;r129=r114;r130=r108}}while(0);r108=r29+r37|0;if((r108|0)<(r68|0)){r71=r71+1|0;r29=r108;r73=r104;r32=r107;r84=r69;r69=r105;r85=r103;r70=r123;r81=r122;r82=r121;r83=r124;r80=r125;r79=r126;r78=r127;r72=r128;r77=r129;r102=r130}else{r131=r104;break}}}else{r131=r101}r102=r100+1|0;if((r102|0)<(r37|0)){r100=r102;r101=r131}else{r4=1020;break}}}else if((r36|0)==7){r37=HEAP32[r14];if((r37|0)>122879){r4=1020;break}if((r37|0)>0){r68=r37;r67=0;while(1){r102=r67+1|0;r77=HEAP32[r12];r72=HEAP8[r77+r67|0];if(r72<<24>>24==2){r78=HEAP8[r77+r102|0];r132=r78<<24>>24==2?2:r78-32&255;r133=r67+2|0}else{r132=r72;r133=r102}r102=r68+1|0;HEAP8[r77+r68|0]=r132;if((r133|0)<(r37|0)){r68=r102;r67=r133}else{r134=r102;break}}}else{r134=r37}HEAP32[HEAP32[r12]+245788>>2]=r134-r37;HEAP32[HEAP32[r12]+245792>>2]=r37;r4=1020;break}else{r4=1020;break}}else if((r24|0)==5){if((HEAP32[r7]&2|0)!=0){r4=1020;break}r67=HEAP32[r26];if(r67>>>0>=r5>>>0){break L1034}if((r23|0)<2){r4=1021;break L1034}r30=r11+(r67*40&-1)|0}else if((r24|0)==2){r67=r21+4|0;if((HEAP32[r67>>2]|0)==0){r135=HEAP32[r28];r136=HEAP32[r26]}else{r135=HEAPU8[r27];r136=HEAPU8[r25]}r68=_llvm_uadd_with_overflow_i32(r136,r135);if((r68|0)==0){r137=2}else{r137=tempRet0&1|r68&-2147483648}HEAP32[r7]=r137;if((HEAP32[r67>>2]|0)==0){HEAP32[r26]=r68;r4=1020;break}else{HEAP8[r25]=r68&255;r4=1020;break}}else{r4=1020}}while(0);if(r4==1020){r4=0;r30=r21+40|0}if(r30>>>0>r8>>>0|r30>>>0<r11>>>0){r4=1021;break}else{r21=r30,r22=r21>>2;r23=r23-1|0}}}}while(0);if(r4==1021){HEAP32[r11>>2]=22}r11=HEAP32[r12];r4=HEAP32[r11+245792>>2]&262143;r30=HEAP32[r11+245788>>2]&262143;r8=(r30+r4|0)>>>0>262143;HEAP32[r3+15]=r11+(r8?0:r4);HEAP32[r3+16]=r8?0:r30;r30=(r2+16|0)>>2;r2=HEAP32[r30];if((r2|0)!=0){_free(r2);HEAP32[r30]=0;HEAP32[r6]=0}r2=HEAP32[HEAP32[r12]+245808>>2];r8=r2>>>0<8192?r2:8192;if((r8|0)==0){r10=1;return r10}r2=r8+64|0;r8=HEAP32[r6]+r2|0;HEAP32[r6]=r8;r6=_realloc(0,r8);HEAP32[r30]=r6;if((r6|0)==0){r10=0;return r10}r30=HEAP32[r12]+245760|0;_memcpy(r6,r30,r2)|0;r10=1;return r10}function _rarvm_optimize(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=HEAP32[r1>>2],r3=r2>>2;r4=HEAP32[r1+12>>2];if((r4|0)>0){r5=0}else{return}while(1){r1=(r2+(r5*40&-1)|0)>>2;r6=HEAP32[r1];L1385:do{if((r6|0)==0){HEAP32[r1]=(HEAP32[((r5*40&-1)+4>>2)+r3]|0)!=0?40:41}else if((r6|0)==1){HEAP32[r1]=(HEAP32[((r5*40&-1)+4>>2)+r3]|0)!=0?42:43}else{if((HEAP8[r6+8|0]&64)==0){break}else{r7=r5}while(1){r8=r7+1|0;if((r8|0)>=(r4|0)){break}r9=HEAPU8[HEAP32[((r8*40&-1)>>2)+r3]+8|0];if((r9&56|0)!=0){break L1385}if((r9&64|0)==0){r7=r8}else{break}}if((r6|0)==3){HEAP32[r1]=(HEAP32[((r5*40&-1)+4>>2)+r3]|0)!=0?46:47;break}else if((r6|0)==2){HEAP32[r1]=(HEAP32[((r5*40&-1)+4>>2)+r3]|0)!=0?44:45;break}else if((r6|0)==6){HEAP32[r1]=(HEAP32[((r5*40&-1)+4>>2)+r3]|0)!=0?48:49;break}else if((r6|0)==7){HEAP32[r1]=(HEAP32[((r5*40&-1)+4>>2)+r3]|0)!=0?50:51;break}else if((r6|0)==27){HEAP32[r1]=(HEAP32[((r5*40&-1)+4>>2)+r3]|0)!=0?52:53;break}else{break}}}while(0);r1=r5+1|0;if((r1|0)<(r4|0)){r5=r1}else{break}}return}function _addbits(r1,r2){var r3,r4;r3=r1+4227080|0;r4=HEAP32[r3>>2]+r2|0;r2=r1+4227076|0;HEAP32[r2>>2]=(r4>>3)+HEAP32[r2>>2];HEAP32[r3>>2]=r4&7;return}function _getbits(r1){var r2;r2=HEAP32[r1+4227076>>2];return(HEAPU8[r1+(r2+5)|0]<<8|HEAPU8[r1+(r2+4)|0]<<16|HEAPU8[r1+(r2+6)|0])>>>((8-HEAP32[r1+4227080>>2]|0)>>>0)&65535}function _rarvm_decode_arg(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12;r5=r3>>2;r6=(r2+8|0)>>2;r7=HEAP32[r6];r8=HEAP32[r2>>2];r9=(r2+12|0)>>2;r10=(HEAPU8[r7+(r8+1)|0]<<8|HEAPU8[r8+r7|0]<<16|HEAPU8[r7+(r8+2)|0])>>>((8-HEAP32[r9]|0)>>>0);if((r10&32768|0)!=0){HEAP32[r5]=0;r8=r10>>>12&7;HEAP32[r5+1]=r8;HEAP32[r5+3]=(r8<<2)+r1+4;r8=HEAP32[r9]+4|0;HEAP32[r6]=(r8>>3)+HEAP32[r6];HEAP32[r9]=r8&7;return}r8=r3|0;if((r10&49152|0)==0){HEAP32[r8>>2]=1;if((r4|0)==0){r4=HEAP32[r9]+2|0;HEAP32[r6]=(r4>>3)+HEAP32[r6];HEAP32[r9]=r4&7;HEAP32[r5+1]=_rarvm_read_data(r2);return}else{HEAP32[r5+1]=r10>>>6&255;r4=HEAP32[r9]+10|0;HEAP32[r6]=(r4>>3)+HEAP32[r6];HEAP32[r9]=r4&7;return}}HEAP32[r8>>2]=2;if((r10&8192|0)==0){r8=r10>>>10&7;HEAP32[r5+1]=r8;HEAP32[r5+3]=(r8<<2)+r1+4;HEAP32[r5+2]=0;r8=HEAP32[r9]+6|0;HEAP32[r6]=(r8>>3)+HEAP32[r6];HEAP32[r9]=r8&7;return}if((r10&4096|0)==0){r8=r10>>>9&7;HEAP32[r5+1]=r8;HEAP32[r5+3]=(r8<<2)+r1+4;r1=HEAP32[r9]+7|0;r11=r1;r12=(r1>>3)+HEAP32[r6]|0}else{HEAP32[r5+1]=0;r1=HEAP32[r9]+4|0;r11=r1;r12=(r1>>3)+HEAP32[r6]|0}HEAP32[r6]=r12;HEAP32[r9]=r11&7;HEAP32[r5+2]=_rarvm_read_data(r2);return}function _rarvm_prepare(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33;r6=0;r7=(r2+12|0)>>2;HEAP32[r7]=0;r8=(r2+8|0)>>2;HEAP32[r8]=0;r9=(r2|0)>>2;r10=HEAP32[r9];r11=(r4|0)<32768?r4:32768;_memcpy(r10,r3,r11)|0;if((r4|0)>1){r11=1;r10=0;while(1){r12=HEAPU8[r3+r11|0]^r10;r13=r11+1|0;if((r13|0)<(r4|0)){r11=r13;r10=r12}else{r14=r12;break}}}else{r14=0}r10=HEAP32[r7]+8|0;HEAP32[r8]=(r10>>3)+HEAP32[r8];HEAP32[r7]=r10&7;r10=(r5+12|0)>>2;HEAP32[r10]=0;do{if((r14|0)==(HEAPU8[r3]|0)){r11=~_rar_crc(-1,r3,r4);r12=0;while(1){if((HEAP32[(r12*12&-1)+1420>>2]|0)==(r11|0)){if((HEAP32[(r12*12&-1)+1416>>2]|0)==(r4|0)){r6=1077;break}}r13=r12+1|0;if(r13>>>0<7){r12=r13}else{r15=r4;break}}if(r6==1077){r11=HEAP32[(r12*12&-1)+1424>>2];_rar_cmd_array_add(r5|0,1);r13=HEAP32[r10];HEAP32[r10]=r13+1;r16=HEAP32[r5>>2],r17=r16>>2;HEAP32[((r13*40&-1)>>2)+r17]=54;r18=r16+(r13*40&-1)+12|0;HEAP32[r18>>2]=r11;HEAP32[((r13*40&-1)+20>>2)+r17]=r18;HEAP32[((r13*40&-1)+36>>2)+r17]=r16+(r13*40&-1)+28;HEAP32[((r13*40&-1)+24>>2)+r17]=3;HEAP32[((r13*40&-1)+8>>2)+r17]=3;r15=0}r17=HEAP32[r8];r13=HEAP32[r9];r16=HEAPU8[r17+(r13+1)|0]<<8|HEAPU8[r13+r17|0]<<16|HEAPU8[r17+(r13+2)|0];r13=HEAP32[r7];r18=r13+1|0;r11=(r18>>3)+r17|0;HEAP32[r8]=r11;HEAP32[r7]=r18&7;L1441:do{if((r16&32768<<8-r13|0)==0){r19=r11}else{r18=_rarvm_read_data(r2)+1|0;r17=_malloc(r18);r20=(r5+20|0)>>2;HEAP32[r20]=r17;if((r17|0)==0){r21=0;return r21}r22=HEAP32[r8];if(!((r22|0)<(r15|0)&(r18|0)>0)){r19=r22;break}r22=r5+28|0;r23=0;r24=r17;while(1){r17=HEAP32[r22>>2]+1|0;HEAP32[r22>>2]=r17;r25=_realloc(r24,r17);HEAP32[r20]=r25;if((r25|0)==0){r21=0;break}r17=HEAP32[r8];r26=HEAP32[r9];r27=HEAP32[r7];HEAP8[r25+r23|0]=(HEAPU8[r17+(r26+1)|0]<<8|HEAPU8[r26+r17|0]<<16|HEAPU8[r17+(r26+2)|0])>>>((8-r27|0)>>>0)>>>8&255;r26=r27+8|0;r27=(r26>>3)+r17|0;HEAP32[r8]=r27;HEAP32[r7]=r26&7;r26=r23+1|0;if(!((r27|0)<(r15|0)&(r26|0)<(r18|0))){r19=r27;break L1441}r23=r26;r24=HEAP32[r20]}return r21}}while(0);if((r19|0)>=(r15|0)){r28=r15;break}r11=r5|0;r13=r5|0;while(1){_rar_cmd_array_add(r11,1);r16=HEAP32[r10];r12=HEAP32[r13>>2],r20=r12>>2;r24=r12+(r16*40&-1)|0;r23=HEAP32[r8];r18=HEAP32[r9];r22=(HEAPU8[r23+(r18+1)|0]<<8|HEAPU8[r18+r23|0]<<16|HEAPU8[r23+(r18+2)|0])>>>((8-HEAP32[r7]|0)>>>0);r18=r22&65535;if((r22&32768|0)==0){HEAP32[r24>>2]=r18>>>12;r22=HEAP32[r7]+4|0;r29=r22;r30=(r22>>3)+HEAP32[r8]|0}else{HEAP32[r24>>2]=(r18>>>10)-24;r18=HEAP32[r7]+6|0;r29=r18;r30=(r18>>3)+HEAP32[r8]|0}HEAP32[r8]=r30;r18=r29&7;HEAP32[r7]=r18;r22=(r24|0)>>2;r24=HEAP8[HEAP32[r22]+8|0];if((r24&4)==0){HEAP32[((r16*40&-1)+4>>2)+r20]=0;r31=r24}else{r24=HEAP32[r9];HEAP32[((r16*40&-1)+4>>2)+r20]=(HEAPU8[r30+(r24+1)|0]<<8|HEAPU8[r24+r30|0]<<16|HEAPU8[r30+(r24+2)|0])>>>((8-r18|0)>>>0)>>>15&1;r18=HEAP32[r7]+1|0;HEAP32[r8]=(r18>>3)+HEAP32[r8];HEAP32[r7]=r18&7;r31=HEAP8[HEAP32[r22]+8|0]}r18=r12+(r16*40&-1)+24|0;HEAP32[r18>>2]=3;r24=r12+(r16*40&-1)+8|0;r23=r24|0;HEAP32[r23>>2]=3;r26=r31&3;HEAP32[((r16*40&-1)+36>>2)+r20]=0;HEAP32[((r16*40&-1)+20>>2)+r20]=0;do{if((r26|0)!=0){r20=r12+(r16*40&-1)+4|0;_rarvm_decode_arg(r1,r2,r24,HEAP32[r20>>2]);if((r26|0)==2){_rarvm_decode_arg(r1,r2,r18,HEAP32[r20>>2]);break}if((HEAP32[r23>>2]|0)!=1){break}if((HEAP8[HEAP32[r22]+8|0]&24)==0){break}r20=r12+(r16*40&-1)+12|0;r27=HEAP32[r20>>2];if((r27|0)>255){r32=r27-256|0}else{do{if((r27|0)>135){r33=r27-264|0}else{if((r27|0)>15){r33=r27-8|0;break}else{r33=(r27|0)>7?r27-16|0:r27;break}}}while(0);r32=HEAP32[r10]+r33|0}HEAP32[r20>>2]=r32}}while(0);HEAP32[r10]=HEAP32[r10]+1;if((HEAP32[r8]|0)>=(r15|0)){r28=r15;break}}}else{r28=r4}}while(0);_rar_cmd_array_add(r5|0,1);r4=HEAP32[r10];HEAP32[r10]=r4+1;r15=r5|0;r8=HEAP32[r15>>2],r32=r8>>2;HEAP32[((r4*40&-1)>>2)+r32]=22;HEAP32[((r4*40&-1)+20>>2)+r32]=r8+(r4*40&-1)+12;HEAP32[((r4*40&-1)+36>>2)+r32]=r8+(r4*40&-1)+28;HEAP32[((r4*40&-1)+24>>2)+r32]=3;HEAP32[((r4*40&-1)+8>>2)+r32]=3;if((HEAP32[r10]|0)>0){r32=0;while(1){r4=HEAP32[r15>>2];r8=r4+(r32*40&-1)+20|0;if((HEAP32[r8>>2]|0)==0){HEAP32[r8>>2]=r4+(r32*40&-1)+12}r8=r4+(r32*40&-1)+36|0;if((HEAP32[r8>>2]|0)==0){HEAP32[r8>>2]=r4+(r32*40&-1)+28}r4=r32+1|0;if((r4|0)<(HEAP32[r10]|0)){r32=r4}else{break}}}if((r28|0)==0){r21=1;return r21}_rarvm_optimize(r5);r21=1;return r21}function _unp_read_buf(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=(r2+4227096|0)>>2;r4=HEAP32[r3];r5=(r2+4227076|0)>>2;r6=HEAP32[r5];r7=r4-r6|0;if((r7|0)<0){r8=0;return r8}if((r6|0)>16384){if((r7|0)>0){_memmove(r2+4|0,r2+(r6+4)|0,r7,1,0)}HEAP32[r5]=0;HEAP32[r3]=r7;r9=r7}else{r9=r4}r4=(r2+4249552|0)>>2;r7=HEAP32[r4];r6=32768-r9&-16;r10=_read(r1,r2+(r9+4)|0,r7>>>0<r6>>>0?r7:r6);r6=HEAP32[r3];if((r10|0)>0){r7=r6+r10|0;HEAP32[r3]=r7;HEAP32[r4]=HEAP32[r4]-r10;r11=r7}else{r11=r6}r6=r11-30|0;HEAP32[r2+4227100>>2]=r6;do{if((r6|0)<(HEAP32[r5]|0)){r7=(r11+30|0)<32768?30:32768-r11|0;if((r7|0)==0){break}_memset(r2+(r11+4)|0,0,r7)}}while(0);r8=(r10|0)!=-1|0;return r8}function _rar_get_char(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=(r2+4227076|0)>>2;r4=HEAP32[r3];do{if((r4|0)>32738){r5=(r2+4227096|0)>>2;r6=HEAP32[r5]-r4|0;if((r6|0)<0){r7=-1;return r7}if((r6|0)>0){_memmove(r2+4|0,r2+(r4+4)|0,r6,1,0)}HEAP32[r3]=0;HEAP32[r5]=r6;r8=(r2+4249552|0)>>2;r9=HEAP32[r8];r10=32768-r6&-16;r11=_read(r1,r2+(r6+4)|0,r9>>>0<r10>>>0?r9:r10);r10=HEAP32[r5];if((r11|0)>0){r9=r10+r11|0;HEAP32[r5]=r9;HEAP32[r8]=HEAP32[r8]-r11;r12=r9}else{r12=r10}r10=r12-30|0;HEAP32[r2+4227100>>2]=r10;do{if((r10|0)<(HEAP32[r3]|0)){r9=(r12+30|0)<32768?30:32768-r12|0;if((r9|0)==0){break}_memset(r2+(r12+4)|0,0,r9)}}while(0);if((r11|0)==-1){r7=-1;return r7}else{r13=HEAP32[r3];break}}else{r13=r4}}while(0);HEAP32[r3]=r13+1;r7=HEAPU8[r2+(r13+4)|0];return r7}function _decode_number(r1,r2){var r3,r4,r5,r6,r7,r8;r3=r2>>2;r2=r1+4227076|0;r4=HEAP32[r2>>2];r5=r1+4227080|0;r6=HEAP32[r5>>2];r7=(HEAPU8[r1+(r4+5)|0]<<8|HEAPU8[r1+(r4+4)|0]<<16|HEAPU8[r1+(r4+6)|0])>>>((8-r6|0)>>>0)&65534;do{if(r7>>>0<HEAP32[r3+9]>>>0){if(r7>>>0<HEAP32[r3+5]>>>0){if(r7>>>0<HEAP32[r3+3]>>>0){r8=r7>>>0<HEAP32[r3+2]>>>0?1:2;break}else{r8=r7>>>0<HEAP32[r3+4]>>>0?3:4;break}}else{if(r7>>>0<HEAP32[r3+7]>>>0){r8=r7>>>0<HEAP32[r3+6]>>>0?5:6;break}else{r8=r7>>>0<HEAP32[r3+8]>>>0?7:8;break}}}else{if(r7>>>0>=HEAP32[r3+13]>>>0){if(r7>>>0>=HEAP32[r3+15]>>>0){r8=15;break}r8=r7>>>0<HEAP32[r3+14]>>>0?13:14;break}if(r7>>>0<HEAP32[r3+11]>>>0){r8=r7>>>0<HEAP32[r3+10]>>>0?9:10;break}else{r8=r7>>>0<HEAP32[r3+12]>>>0?11:12;break}}}while(0);r1=r6+r8|0;HEAP32[r2>>2]=(r1>>3)+r4;HEAP32[r5>>2]=r1&7;r1=((r7-HEAP32[((r8-1<<2)+4>>2)+r3]|0)>>>((16-r8|0)>>>0))+HEAP32[((r8<<2)+68>>2)+r3]|0;return HEAP32[(((r1>>>0>=HEAP32[r3]>>>0?0:r1)<<2)+132>>2)+r3]}function _unp_write_buf_old(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=(r1+4227084|0)>>2;r3=HEAP32[r2];r4=(r1+4227088|0)>>2;r5=HEAP32[r4];r6=r1+(r5+32772)|0;if(r3>>>0<r5>>>0){r7=-r5&4194303;r8=r1|0;_write(HEAP32[r8>>2],r6,r7);r9=(r1+4249536|0)>>2;HEAP32[r9]=_i64Add(HEAP32[r9],HEAP32[r9+1],r7,0);HEAP32[r9+1]=tempRet0;r10=(r1+4249596|0)>>2;HEAP32[r10]=_rar_crc(HEAP32[r10],r6,r7);r7=r1+32772|0;r11=HEAP32[r2];_write(HEAP32[r8>>2],r7,r11);HEAP32[r9]=_i64Add(HEAP32[r9],HEAP32[r9+1],r11,(r11|0)<0?-1:0);HEAP32[r9+1]=tempRet0;HEAP32[r10]=_rar_crc(HEAP32[r10],r7,r11);r12=HEAP32[r2];HEAP32[r4]=r12;return}else{r11=r3-r5|0;_write(HEAP32[r1>>2],r6,r11);r5=(r1+4249536|0)>>2;HEAP32[r5]=_i64Add(HEAP32[r5],HEAP32[r5+1],r11,(r11|0)<0?-1:0);HEAP32[r5+1]=tempRet0;r5=r1+4249596|0;HEAP32[r5>>2]=_rar_crc(HEAP32[r5>>2],r6,r11);r12=HEAP32[r2];HEAP32[r4]=r12;return}}function _make_decode_tables(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r4=r2>>2;r5=STACKTOP;STACKTOP=STACKTOP+128|0;r6=r5;r7=r5+64;_memset(r6,0,64);_memset(r2+132|0,0,r3<<2);r8=(r3|0)>0;if(r8){r9=0;while(1){r10=((HEAP8[r1+r9|0]&15)<<2)+r6|0;HEAP32[r10>>2]=HEAP32[r10>>2]+1;r10=r9+1|0;if((r10|0)<(r3|0)){r9=r10}else{break}}}HEAP32[r6>>2]=0;HEAP32[r4+1]=0;HEAP32[r4+17]=0;HEAP32[r7>>2]=0;r9=1;r10=0;r11=0;r12=0;while(1){r13=HEAP32[r6+(r9<<2)>>2];r14=r13+r10<<1;r15=r14<<15-r9;HEAP32[((r9<<2)+4>>2)+r4]=(r15|0)>65535?65535:r15;r15=r12+r11|0;HEAP32[((r9<<2)+68>>2)+r4]=r15;HEAP32[r7+(r9<<2)>>2]=r15;r16=r9+1|0;if((r16|0)<16){r9=r16;r10=r14;r11=r15;r12=r13}else{break}}if(r8){r17=0}else{r18=r2|0;HEAP32[r18>>2]=r3;STACKTOP=r5;return}while(1){r8=HEAP8[r1+r17|0];if(r8<<24>>24!=0){r12=((r8&15)<<2)+r7|0;r8=HEAP32[r12>>2];HEAP32[r12>>2]=r8+1;HEAP32[((r8<<2)+132>>2)+r4]=r17}r8=r17+1|0;if((r8|0)<(r3|0)){r17=r8}else{break}}r18=r2|0;HEAP32[r18>>2]=r3;STACKTOP=r5;return}function _unpack_init_data(r1,r2){var r3,r4,r5;r3=r2>>2;if((r1|0)==0){HEAP32[r3+1056773]=0;_memset(r2+4227116|0,0,404);r4=(r2+4229876|0)>>2;HEAP32[r4]=0;HEAP32[r4+1]=0;HEAP32[r4+2]=0;HEAP32[r4+3]=0;HEAP32[r4+4]=0;HEAP32[r4+5]=0;HEAP32[r4+6]=0;HEAP32[r3+1062375]=2;HEAP32[r3+1056771]=0;HEAP32[r3+1056772]=0;r4=r2+4249524|0;r5=HEAP32[r4>>2];if((r5|0)!=0){_free(r5);HEAP32[r4>>2]=0}HEAP32[r3+1062383]=0;HEAP32[r3+1062382]=0;_rar_filter_array_reset(r2+4249508|0);_rar_filter_array_reset(r2+4249516|0)}HEAP32[r3+1056770]=0;HEAP32[r3+1056769]=0;HEAP32[r3+1056774]=0;HEAP32[r3+1062376]=0;r4=r2+4249536|0;HEAP32[r4>>2]=0;HEAP32[r4+4>>2]=0;_rarvm_init(r2+4249556|0);HEAP32[r3+1062399]=-1;_unpack_init_data20(r1,r2);return}function _rar_unpack29(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86;r4=r3>>2;r5=0;_unpack_init_data(r2,r3);r6=(r3+4227096|0)>>2;r7=HEAP32[r6];r8=(r3+4227076|0)>>2;r9=HEAP32[r8];r10=r7-r9|0;if((r10|0)<0){r11=0;return r11}if((r9|0)>16384){if((r10|0)>0){_memmove(r3+4|0,r3+(r9+4)|0,r10,1,0)}HEAP32[r8]=0;HEAP32[r6]=r10;r12=r10}else{r12=r7}r7=(r3+4249552|0)>>2;r10=HEAP32[r7];r9=32768-r12&-16;r13=_read(r1,r3+(r12+4)|0,r10>>>0<r9>>>0?r10:r9);r9=HEAP32[r6];if((r13|0)>0){r10=r9+r13|0;HEAP32[r6]=r10;HEAP32[r7]=HEAP32[r7]-r13;r14=r10}else{r14=r9}r9=r14-30|0;r10=(r3+4227100|0)>>2;HEAP32[r10]=r9;do{if((r9|0)<(HEAP32[r8]|0)){r12=(r14+30|0)<32768?30:32768-r14|0;if((r12|0)==0){break}_memset(r3+(r14+4)|0,0,r12)}}while(0);if((r13|0)==-1){r11=0;return r11}if((r2|0)==0){r5=1201}else{r2=r3+4227092|0;if((HEAP32[r2>>2]|0)==0){r5=1201}else{r15=r2}}do{if(r5==1201){if((_read_tables(r1,r3)|0)==0){r11=0;return r11}else{r15=r3+4227092|0;break}}}while(0);r2=(r3+4227084|0)>>2;r13=r3+4|0;r14=r3+4227088|0;r9=r3+4227104|0;r12=r3+4229904|0;r16=r3+4249500|0;r17=r3+4227520|0;r18=(r3+4227080|0)>>2;r19=r3+4228848|0;r20=(r3+4227112|0)>>2;r21=(r3+4227108|0)>>2;r22=r3+4229220|0;r23=(r3+4229884|0)>>2;r24=r3+4229888|0;r25=(r3+4229880|0)>>2;r26=(r3+4229876|0)>>2;r27=(r3+4229896|0)>>2;r28=(r3+4229900|0)>>2;r29=r3+4229420|0;r30=0;L1615:while(1){r31=HEAP32[r2]&4194303;HEAP32[r2]=r31;r32=HEAP32[r8];if((r32|0)>(HEAP32[r10]|0)){r33=HEAP32[r6];r34=r33-r32|0;if((r34|0)<0){r11=0;r5=1341;break}if((r32|0)>16384){if((r34|0)>0){_memmove(r13,r3+(r32+4)|0,r34,1,0)}HEAP32[r8]=0;HEAP32[r6]=r34;r35=r34}else{r35=r33}r33=HEAP32[r7];r34=32768-r35&-16;r32=_read(r1,r3+(r35+4)|0,r33>>>0<r34>>>0?r33:r34);r34=HEAP32[r6];if((r32|0)>0){r33=r34+r32|0;HEAP32[r6]=r33;HEAP32[r7]=HEAP32[r7]-r32;r36=r33}else{r36=r34}r34=r36-30|0;HEAP32[r10]=r34;do{if((r34|0)<(HEAP32[r8]|0)){r33=(r36+30|0)<32768?30:32768-r36|0;if((r33|0)==0){break}_memset(r3+(r36+4)|0,0,r33)}}while(0);if((r32|0)==-1){r11=0;r5=1329;break}r37=HEAP32[r2]}else{r37=r31}r34=HEAP32[r14>>2];if(!((r34-r37&4194300)>>>0>259|(r34|0)==(r37|0))){_unp_write_buf(r3)}if((HEAP32[r9>>2]|0)==1){r34=_ppm_decode_char(r12,r1,r3);if((r34|0)==-1){r5=1221;break}do{if((r34|0)==(HEAP32[r16>>2]|0)){r33=_ppm_decode_char(r12,r1,r3);if((r33|0)==-1){r5=1224;break L1615}else if((r33|0)==0){if((_read_tables(r1,r3)|0)==0){r11=0;r5=1327;break L1615}else{r30=r30;continue L1615}}else if((r33|0)==3){r38=_ppm_decode_char(r12,r1,r3);if((r38|0)==-1){r11=0;r5=1328;break L1615}r39=r38&7;r40=r39+1|0;if((r39|0)==6){r41=_ppm_decode_char(r12,r1,r3);if((r41|0)==-1){r11=0;r5=1334;break L1615}r42=r41+7|0}else if((r39|0)==7){r39=_ppm_decode_char(r12,r1,r3);if((r39|0)==-1){r11=0;r5=1335;break L1615}r41=_ppm_decode_char(r12,r1,r3);if((r41|0)==-1){r11=0;r5=1345;break L1615}r42=(r39<<8)+r41|0}else{r42=r40}r43=_malloc(r42+2|0);if((r43|0)==0){r11=0;r5=1346;break L1615}if((r42|0)>0){r40=0;while(1){r41=_ppm_decode_char(r12,r1,r3);if((r41|0)==-1){r5=1236;break L1615}HEAP8[r43+r40|0]=r41&255;r41=r40+1|0;if((r41|0)<(r42|0)){r40=r41}else{break}}}r40=_add_vm_code(r3,r38,r43,r42);_free(r43);if((r40|0)==0){r11=0;r5=1331;break L1615}else{r30=r30;continue L1615}}else if((r33|0)==4){r40=0;r41=0;while(1){r44=_ppm_decode_char(r12,r1,r3);if((r44|0)==-1){r11=0;r5=1332;break L1615}if((r40|0)==3){r5=1241;break}r39=r44&255|r41<<8;r45=r40+1|0;if((r45|0)<4){r40=r45;r41=r39}else{r46=r30;r47=r39;break}}if(r5==1241){r5=0;r46=r44&255;r47=r41}r40=r46+32|0;r38=HEAP32[r2];r39=-2-r47+r38|0;if(r39>>>0<4194044&r38>>>0<4194044){r45=HEAP8[r3+(r39+32772)|0];HEAP32[r2]=r38+1;HEAP8[r3+(r38+32772)|0]=r45;r45=r46+31|0;if((r45|0)==0){r30=r46;continue L1615}else{r48=r39;r49=r45}while(1){r45=r48+1|0;r50=HEAP8[r3+(r45+32772)|0];r51=HEAP32[r2];HEAP32[r2]=r51+1;HEAP8[r3+(r51+32772)|0]=r50;r50=r49-1|0;if((r50|0)==0){r30=r46;continue L1615}else{r48=r45;r49=r50}}}else{if((r40|0)==0){r30=r46;continue L1615}else{r52=r40;r53=r39;r54=r38}while(1){r41=r52-1|0;HEAP8[r3+(r54+32772)|0]=HEAP8[(r53&4194303)+r3+32772|0];r50=HEAP32[r2]+1&4194303;HEAP32[r2]=r50;if((r41|0)==0){r30=r46;continue L1615}else{r52=r41;r53=r53+1|0;r54=r50}}}}else if((r33|0)==5){r38=_ppm_decode_char(r12,r1,r3);if((r38|0)==-1){r11=0;r5=1340;break L1615}r39=r38+4|0;r40=HEAP32[r2];r50=r40-1|0;if(r50>>>0<4194044&r40>>>0<4194044){r41=HEAP8[r3+(r50+32772)|0];HEAP32[r2]=r40+1;HEAP8[r3+(r40+32772)|0]=r41;r41=r38+3|0;if((r41|0)==0){r30=r30;continue L1615}else{r55=r50;r56=r41}while(1){r41=r55+1|0;r38=HEAP8[r3+(r41+32772)|0];r45=HEAP32[r2];HEAP32[r2]=r45+1;HEAP8[r3+(r45+32772)|0]=r38;r38=r56-1|0;if((r38|0)==0){r30=r30;continue L1615}else{r55=r41;r56=r38}}}else{if((r39|0)==0){r30=r30;continue L1615}else{r57=r39;r58=r50;r59=r40}while(1){r38=r57-1|0;HEAP8[r3+(r59+32772)|0]=HEAP8[(r58&4194303)+r3+32772|0];r41=HEAP32[r2]+1&4194303;HEAP32[r2]=r41;if((r38|0)==0){r30=r30;continue L1615}else{r57=r38;r58=r58+1|0;r59=r41}}}}else if((r33|0)==2){r5=1324;break L1615}else{break}}}while(0);r31=HEAP32[r2];HEAP32[r2]=r31+1;HEAP8[r3+(r31+32772)|0]=r34&255;r30=r30;continue}r31=_decode_number(r3,r17);if((r31|0)<256){r32=HEAP32[r2];HEAP32[r2]=r32+1;HEAP8[r3+(r32+32772)|0]=r31&255;r30=r30;continue}if((r31|0)>270){r32=r31-271|0;r40=HEAPU8[r32+336|0]+3|0;r50=HEAPU8[r32+368|0];if((r31-279|0)>>>0<20){r32=HEAP32[r8];r39=HEAP32[r18];r41=(((HEAPU8[r3+(r32+5)|0]<<8|HEAPU8[r3+(r32+4)|0]<<16|HEAPU8[r3+(r32+6)|0])>>>((8-r39|0)>>>0)&65535)>>>((16-r50|0)>>>0))+r40|0;r38=r39+r50|0;HEAP32[r8]=(r38>>3)+r32;HEAP32[r18]=r38&7;r60=r41}else{r60=r40}r40=_decode_number(r3,r19);r41=HEAP32[(r40<<2)+400>>2]+1|0;r38=HEAPU8[r40+640|0];do{if((r40-4|0)>>>0<56){if((r40|0)<=9){r32=HEAP32[r8];r50=HEAP32[r18];r39=(((HEAPU8[r3+(r32+5)|0]<<8|HEAPU8[r3+(r32+4)|0]<<16|HEAPU8[r3+(r32+6)|0])>>>((8-r50|0)>>>0)&65535)>>>((16-r38|0)>>>0))+r41|0;r45=r50+r38|0;HEAP32[r8]=(r45>>3)+r32;HEAP32[r18]=r45&7;r61=r39;break}if((r40-12|0)>>>0<48){r39=HEAP32[r8];r45=HEAP32[r18];r32=(((HEAPU8[r3+(r39+5)|0]<<8|HEAPU8[r3+(r39+4)|0]<<16|HEAPU8[r3+(r39+6)|0])>>>((8-r45|0)>>>0)&65535)>>>((20-r38|0)>>>0)<<4)+r41|0;r50=r38-4+r45|0;HEAP32[r8]=(r50>>3)+r39;HEAP32[r18]=r50&7;r62=r32}else{r62=r41}r32=HEAP32[r20];if((r32|0)>0){HEAP32[r20]=r32-1;r61=HEAP32[r21]+r62|0;break}r32=_decode_number(r3,r22);if((r32|0)==16){HEAP32[r20]=15;r61=HEAP32[r21]+r62|0;break}else{HEAP32[r21]=r32;r61=r32+r62|0;break}}else{r61=r41}}while(0);if(r61>>>0>8191){r63=(r61>>>0>262143?2:1)+r60|0}else{r63=r60}HEAP32[r24>>2]=HEAP32[r23];HEAP32[r23]=HEAP32[r25];HEAP32[r25]=HEAP32[r26];HEAP32[r26]=r61;HEAP32[r27]=r61;HEAP32[r28]=r63;r41=HEAP32[r2];r38=r41-r61|0;if(r38>>>0<4194044&r41>>>0<4194044){r40=HEAP8[r3+(r38+32772)|0];HEAP32[r2]=r41+1;HEAP8[r3+(r41+32772)|0]=r40;r40=r63-1|0;if((r40|0)==0){r30=r30;continue}else{r64=r38;r65=r40}while(1){r40=r64+1|0;r34=HEAP8[r3+(r40+32772)|0];r32=HEAP32[r2];HEAP32[r2]=r32+1;HEAP8[r3+(r32+32772)|0]=r34;r34=r65-1|0;if((r34|0)==0){r30=r30;continue L1615}else{r64=r40;r65=r34}}}else{if((r63|0)==0){r30=r30;continue}else{r66=r63;r67=r38;r68=r41}while(1){r34=r66-1|0;HEAP8[r3+(r68+32772)|0]=HEAP8[(r67&4194303)+r3+32772|0];r40=HEAP32[r2]+1&4194303;HEAP32[r2]=r40;if((r34|0)==0){r30=r30;continue L1615}else{r66=r34;r67=r67+1|0;r68=r40}}}}if((r31|0)==257){r41=HEAP32[r8];r38=HEAP32[r18];r40=(HEAPU8[r3+(r41+5)|0]<<8|HEAPU8[r3+(r41+4)|0]<<16|HEAPU8[r3+(r41+6)|0])>>>((8-r38|0)>>>0)>>>8;r34=r40&255;r32=r38+8|0;r38=(r32>>3)+r41|0;HEAP32[r8]=r38;r41=r32&7;HEAP32[r18]=r41;r32=r40&7;r40=r32+1|0;if((r32|0)==6){r50=r38+1|0;r39=((HEAPU8[r3+(r50+4)|0]<<8|HEAPU8[r3+(r38+4)|0]<<16|HEAPU8[r3+(r38+6)|0])>>>((8-r41|0)>>>0)>>>8&255)+7|0;HEAP32[r8]=r50;HEAP32[r18]=r41;r69=r39;r70=r50}else if((r32|0)==7){r32=r38+2|0;r50=(HEAPU8[r3+(r38+5)|0]<<8|HEAPU8[r3+(r38+4)|0]<<16|HEAPU8[r3+(r32+4)|0])>>>((8-r41|0)>>>0)&65535;HEAP32[r8]=r32;HEAP32[r18]=r41;r69=r50;r70=r32}else{r69=r40;r70=r38}r38=_malloc(r69+2|0);if((r38|0)==0){r11=0;r5=1344;break}if((r69|0)>0){r40=r69-1|0;r32=0;r50=r70;r39=r41;while(1){r41=HEAP32[r6];do{if((r50|0)<(r41-1|0)){r71=r50;r72=r39}else{r45=r41-r50|0;if((r45|0)<0){if((r32|0)<(r40|0)){r11=0;r5=1337;break L1615}else{r71=r50;r72=r39;break}}if((r50|0)>16384){if((r45|0)>0){_memmove(r13,r3+(r50+4)|0,r45,1,0)}HEAP32[r8]=0;HEAP32[r6]=r45;r73=r45}else{r73=r41}r45=HEAP32[r7];r51=32768-r73&-16;r74=_read(r1,r3+(r73+4)|0,r45>>>0<r51>>>0?r45:r51);r51=HEAP32[r6];if((r74|0)>0){r45=r51+r74|0;HEAP32[r6]=r45;HEAP32[r7]=HEAP32[r7]-r74;r75=r45}else{r75=r51}r51=r75-30|0;HEAP32[r10]=r51;do{if((r51|0)<(HEAP32[r8]|0)){r45=(r75+30|0)<32768?30:32768-r75|0;if((r45|0)==0){break}_memset(r3+(r75+4)|0,0,r45)}}while(0);if((r74|0)==-1&(r32|0)<(r40|0)){r11=0;r5=1336;break L1615}r71=HEAP32[r8];r72=HEAP32[r18]}}while(0);HEAP8[r38+r32|0]=(HEAPU8[r3+(r71+5)|0]<<8|HEAPU8[r3+(r71+4)|0]<<16|HEAPU8[r3+(r71+6)|0])>>>((8-r72|0)>>>0)>>>8&255;r41=r72+8|0;r33=(r41>>3)+r71|0;HEAP32[r8]=r33;r51=r41&7;HEAP32[r18]=r51;r41=r32+1|0;if((r41|0)<(r69|0)){r32=r41;r50=r33;r39=r51}else{break}}}r39=_add_vm_code(r3,r34,r38,r69);_free(r38);if((r39|0)==0){r11=0;r5=1338;break}else{r30=r30;continue}}else if((r31|0)==258){r39=HEAP32[r28];if((r39|0)==0){r30=r30;continue}r50=HEAP32[r2];r32=r50-HEAP32[r27]|0;if(!(r32>>>0<4194044&r50>>>0<4194044)){r40=r39;r51=r32;r33=r50;while(1){r41=r40-1|0;HEAP8[r3+(r33+32772)|0]=HEAP8[(r51&4194303)+r3+32772|0];r45=HEAP32[r2]+1&4194303;HEAP32[r2]=r45;if((r41|0)==0){r30=r30;continue L1615}else{r40=r41;r51=r51+1|0;r33=r45}}}r33=HEAP8[r3+(r32+32772)|0];HEAP32[r2]=r50+1;HEAP8[r3+(r50+32772)|0]=r33;r33=r39-1|0;if((r33|0)==0){r30=r30;continue}else{r76=r32;r77=r33}while(1){r33=r76+1|0;r51=HEAP8[r3+(r33+32772)|0];r40=HEAP32[r2];HEAP32[r2]=r40+1;HEAP8[r3+(r40+32772)|0]=r51;r51=r77-1|0;if((r51|0)==0){r30=r30;continue L1615}else{r76=r33;r77=r51}}}else if((r31|0)==256){r32=HEAP32[r8];r39=HEAP32[r18];r50=(HEAPU8[r3+(r32+5)|0]<<8|HEAPU8[r3+(r32+4)|0]<<16|HEAPU8[r3+(r32+6)|0])>>>((8-r39|0)>>>0);if((r50&32768|0)==0){r51=r39+2|0;HEAP32[r8]=(r51>>3)+r32;HEAP32[r18]=r51&7;r78=1;r79=(r50&16384|0)!=0}else{r50=r39+1|0;HEAP32[r8]=(r50>>3)+r32;HEAP32[r18]=r50&7;r78=0;r79=1}HEAP32[r15>>2]=r79&1^1;if(r78|r79^1){r80=r78&1^1}else{r80=(_read_tables(r1,r3)|0)!=0|0}if((r80|0)==0){r5=1324;break}else{r30=r30;continue}}else{if((r31|0)>=263){r50=r31-263|0;r32=HEAPU8[r50+328|0];r39=HEAP32[r8];r51=HEAP32[r18];r33=HEAPU8[r50+320|0]+(((HEAPU8[r3+(r39+5)|0]<<8|HEAPU8[r3+(r39+4)|0]<<16|HEAPU8[r3+(r39+6)|0])>>>((8-r51|0)>>>0)&65535)>>>((16-r32|0)>>>0))+1|0;r50=r51+r32|0;HEAP32[r8]=(r50>>3)+r39;HEAP32[r18]=r50&7;HEAP32[r24>>2]=HEAP32[r23];HEAP32[r23]=HEAP32[r25];HEAP32[r25]=HEAP32[r26];HEAP32[r26]=r33;HEAP32[r27]=r33;HEAP32[r28]=2;r50=HEAP32[r2];r39=r50-r33|0;if(r39>>>0<4194044&r50>>>0<4194044){r33=HEAP8[r3+(r39+32772)|0];HEAP32[r2]=r50+1;HEAP8[r3+(r50+32772)|0]=r33;r33=HEAP8[r3+(r39+32773)|0];r32=HEAP32[r2];HEAP32[r2]=r32+1;HEAP8[r3+(r32+32772)|0]=r33;r30=r30;continue}else{HEAP8[r3+(r50+32772)|0]=HEAP8[(r39&4194303)+r3+32772|0];r50=HEAP32[r2]+1&4194303;HEAP32[r2]=r50;HEAP8[r3+(r50+32772)|0]=HEAP8[(r39+1&4194303)+r3+32772|0];HEAP32[r2]=HEAP32[r2]+1&4194303;r30=r30;continue}}r39=r31-259|0;r50=HEAP32[((r39<<2)+4229876>>2)+r4];if((r39|0)>0){r33=r39;while(1){r39=r33-1|0;HEAP32[((r33<<2)+4229876>>2)+r4]=HEAP32[((r39<<2)+4229876>>2)+r4];if((r39|0)>0){r33=r39}else{break}}}HEAP32[r26]=r50;r33=_decode_number(r3,r29);r31=HEAPU8[r33+336|0]+2|0;r39=HEAPU8[r33+368|0];if((r33-8|0)>>>0<20){r33=HEAP32[r8];r32=HEAP32[r18];r51=(((HEAPU8[r3+(r33+5)|0]<<8|HEAPU8[r3+(r33+4)|0]<<16|HEAPU8[r3+(r33+6)|0])>>>((8-r32|0)>>>0)&65535)>>>((16-r39|0)>>>0))+r31|0;r40=r32+r39|0;HEAP32[r8]=(r40>>3)+r33;HEAP32[r18]=r40&7;r81=r51}else{r81=r31}HEAP32[r27]=r50;HEAP32[r28]=r81;r31=HEAP32[r2];r51=r31-r50|0;if(r51>>>0<4194044&r31>>>0<4194044){r40=HEAP8[r3+(r51+32772)|0];HEAP32[r2]=r31+1;HEAP8[r3+(r31+32772)|0]=r40;r40=r81-1|0;if((r40|0)==0){r30=r30;continue}else{r82=r51;r83=r40}while(1){r40=r82+1|0;r33=HEAP8[r3+(r40+32772)|0];r39=HEAP32[r2];HEAP32[r2]=r39+1;HEAP8[r3+(r39+32772)|0]=r33;r33=r83-1|0;if((r33|0)==0){r30=r30;continue L1615}else{r82=r40;r83=r33}}}else{if((r81|0)==0){r30=r30;continue}else{r84=r81;r85=r51;r86=r31}while(1){r50=r84-1|0;HEAP8[r3+(r86+32772)|0]=HEAP8[(r85&4194303)+r3+32772|0];r33=HEAP32[r2]+1&4194303;HEAP32[r2]=r33;if((r50|0)==0){r30=r30;continue L1615}else{r84=r50;r85=r85+1|0;r86=r33}}}}}if(r5==1224){HEAP32[r4+1062376]=1;r11=0;return r11}else if(r5==1221){HEAP32[r4+1062376]=1;r11=0;return r11}else if(r5==1324){_unp_write_buf(r3);r11=1;return r11}else if(r5==1236){_free(r43);r11=0;return r11}else if(r5==1327){return r11}else if(r5==1328){return r11}else if(r5==1329){return r11}else if(r5==1331){return r11}else if(r5==1332){return r11}else if(r5==1334){return r11}else if(r5==1335){return r11}else if(r5==1336){return r11}else if(r5==1337){return r11}else if(r5==1338){return r11}else if(r5==1340){return r11}else if(r5==1341){return r11}else if(r5==1344){return r11}else if(r5==1345){return r11}else if(r5==1346){return r11}}function _read_tables(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r3=r2>>2;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+560|0;r6=r5,r7=r6>>2;r8=r5+64,r9=r8>>2;r10=r5+128;r11=r5+152;r12=(r2+4227076|0)>>2;r13=HEAP32[r12];r14=(r2+4227096|0)>>2;r15=HEAP32[r14];do{if((r13|0)>(r15-25|0)){r16=r15-r13|0;if((r16|0)<0){r17=0;STACKTOP=r5;return r17}if((r13|0)>16384){if((r16|0)>0){_memmove(r2+4|0,r2+(r13+4)|0,r16,1,0)}HEAP32[r12]=0;HEAP32[r14]=r16;r18=r16}else{r18=r15}r16=(r2+4249552|0)>>2;r19=HEAP32[r16];r20=32768-r18&-16;r21=_read(r1,r2+(r18+4)|0,r19>>>0<r20>>>0?r19:r20);r20=HEAP32[r14];if((r21|0)>0){r19=r20+r21|0;HEAP32[r14]=r19;HEAP32[r16]=HEAP32[r16]-r21;r22=r19}else{r22=r20}r20=r22-30|0;HEAP32[r3+1056775]=r20;do{if((r20|0)<(HEAP32[r12]|0)){r19=(r22+30|0)<32768?30:32768-r22|0;if((r19|0)==0){break}_memset(r2+(r22+4)|0,0,r19)}}while(0);if((r21|0)==-1){r17=0;STACKTOP=r5;return r17}else{r23=HEAP32[r12];break}}else{r23=r13}}while(0);r13=(r2+4227080|0)>>2;r22=HEAP32[r13];r18=((-r22&7)+r22>>3)+r23|0;HEAP32[r12]=r18;HEAP32[r13]=0;r23=HEAPU8[r2+(r18+4)|0]<<8;r22=r2+4227104|0;if((r23&32768|0)!=0){HEAP32[r22>>2]=1;r17=(_ppm_decode_init(r2+4229904|0,r1,r2,r2+4249500|0)|0)!=0|0;STACKTOP=r5;return r17}HEAP32[r22>>2]=0;HEAP32[r3+1056777]=0;HEAP32[r3+1056778]=0;if((r23&16384|0)==0){_memset(r2+4227116|0,0,404)}HEAP32[r12]=r18;HEAP32[r13]=2;r23=0;r22=r18;r18=2;while(1){r15=(HEAPU8[r2+(r22+5)|0]<<8|HEAPU8[r2+(r22+4)|0]<<16|HEAPU8[r2+(r22+6)|0])>>>((8-r18|0)>>>0)>>>12;r20=r18+4|0;r19=(r20>>3)+r22|0;HEAP32[r12]=r19;r16=r20&7;HEAP32[r13]=r16;do{if((r15&15|0)==15){r20=(HEAPU8[r2+(r19+5)|0]<<8|HEAPU8[r2+(r19+4)|0]<<16|HEAPU8[r2+(r19+6)|0])>>>((8-r16|0)>>>0)>>>12;r24=r19+((r16+4|0)>>>3)|0;HEAP32[r12]=r24;r25=r18&7;HEAP32[r13]=r25;if((r20&15|0)==0){HEAP8[r10+r23|0]=15;r26=r23;r27=r24;r28=r25;break}if(r23>>>0<20){r29=r20&15;r20=-2-r29|0;r30=((r20|0)>-1?-3-r20|0:-2)-r29|0;r29=r23-20|0;r20=r30>>>0>r29>>>0?r30:r29;_memset(r10+r23|0,0,-r20|0);r31=r23-r20|0}else{r31=r23}r26=r31-1|0;r27=r24;r28=r25}else{HEAP8[r10+r23|0]=r15&15;r26=r23;r27=r19;r28=r16}}while(0);r16=r26+1|0;if((r16|0)<20){r23=r16;r22=r27;r18=r28}else{break}}r28=r2+4229664|0;r18=r6;_memset(r18,0,64);_memset(r2+4229796|0,0,80);r27=0;while(1){r22=((HEAP8[r10+r27|0]&15)<<2)+r6|0;HEAP32[r22>>2]=HEAP32[r22>>2]+1;r22=r27+1|0;if((r22|0)<20){r27=r22}else{break}}r27=r28,r22=r27>>2;r23=(r6|0)>>2;HEAP32[r23]=0;HEAP32[r3+1057417]=0;HEAP32[r3+1057433]=0;r26=(r8|0)>>2;HEAP32[r26]=0;r31=1;r16=0;r19=0;r15=0;while(1){r21=HEAP32[(r31<<2>>2)+r7];r25=r21+r16<<1;r24=r25<<15-r31;HEAP32[((r31<<2)+4>>2)+r22]=(r24|0)>65535?65535:r24;r24=r19+r15|0;HEAP32[((r31<<2)+68>>2)+r22]=r24;HEAP32[(r31<<2>>2)+r9]=r24;r20=r31+1|0;if((r20|0)<16){r31=r20;r16=r25;r19=r24;r15=r21}else{r32=0;break}}while(1){r15=HEAP8[r10+r32|0];if(r15<<24>>24!=0){r19=((r15&15)<<2)+r8|0;r15=HEAP32[r19>>2];HEAP32[r19>>2]=r15+1;HEAP32[((r15<<2)+132>>2)+r22]=r32}r15=r32+1|0;if((r15|0)<20){r32=r15}else{break}}HEAP32[r28>>2]=20;r28=r2+4|0;r32=(r2+4249552|0)>>2;r22=r2+4227100|0;r10=0;while(1){r15=HEAP32[r12];r19=HEAP32[r14];if((r15|0)>(r19-5|0)){r16=r19-r15|0;if((r16|0)<0){r17=0;r4=1444;break}if((r15|0)>16384){if((r16|0)>0){_memmove(r28,r2+(r15+4)|0,r16,1,0)}HEAP32[r12]=0;HEAP32[r14]=r16;r33=r16}else{r33=r19}r19=HEAP32[r32];r16=32768-r33&-16;r15=_read(r1,r2+(r33+4)|0,r19>>>0<r16>>>0?r19:r16);r16=HEAP32[r14];if((r15|0)>0){r19=r16+r15|0;HEAP32[r14]=r19;HEAP32[r32]=HEAP32[r32]-r15;r34=r19}else{r34=r16}r16=r34-30|0;HEAP32[r22>>2]=r16;do{if((r16|0)<(HEAP32[r12]|0)){r19=(r34+30|0)<32768?30:32768-r34|0;if((r19|0)==0){break}_memset(r2+(r34+4)|0,0,r19)}}while(0);if((r15|0)==-1){r17=0;r4=1445;break}}r16=_decode_number(r2,r27);do{if((r16|0)<16){HEAP8[r11+r10|0]=HEAPU8[r2+(r10+4227116)|0]+r16&15;r35=r10+1|0}else{if((r16|0)>=18){r19=HEAP32[r12];r31=HEAP32[r13];r21=(HEAPU8[r2+(r19+5)|0]<<8|HEAPU8[r2+(r19+4)|0]<<16|HEAPU8[r2+(r19+6)|0])>>>((8-r31|0)>>>0)&65535;if((r16|0)==18){r36=(r21>>>13)+3|0;r37=r31+3|0}else{r36=(r21>>>9)+11|0;r37=r31+7|0}HEAP32[r12]=(r37>>3)+r19;HEAP32[r13]=r37&7;if(!((r36|0)>0&(r10|0)<404)){r35=r10;break}r19=-r36|0;r31=r10-404|0;r21=r31>>>0<r19>>>0?r19:r31;_memset(r11+r10|0,0,-r21|0);r35=r10-r21|0;break}r21=HEAP32[r12];r31=HEAP32[r13];r19=(HEAPU8[r2+(r21+5)|0]<<8|HEAPU8[r2+(r21+4)|0]<<16|HEAPU8[r2+(r21+6)|0])>>>((8-r31|0)>>>0)&65535;if((r16|0)==16){r38=(r19>>>13)+3|0;r39=r31+3|0}else{r38=(r19>>>9)+11|0;r39=r31+7|0}HEAP32[r12]=(r39>>3)+r21;HEAP32[r13]=r39&7;if(!((r38|0)>0&(r10|0)<404)){r35=r10;break}r21=-r38|0;r31=r10-404|0;r19=r31>>>0<r21>>>0?r21:r31;r31=r10;r21=r38;while(1){r24=r21-1|0;HEAP8[r11+r31|0]=HEAP8[r11+(r31-1)|0];r25=r31+1|0;if((r24|0)>0&(r25|0)<404){r31=r25;r21=r24}else{break}}r35=r10-r19|0}}while(0);if((r35|0)<404){r10=r35}else{r4=1410;break}}if(r4==1410){HEAP32[r3+1056773]=1;if((HEAP32[r12]|0)>(HEAP32[r14]|0)){r17=0;STACKTOP=r5;return r17}r14=r2+4227520|0;_memset(r18,0,64);_memset(r2+4227652|0,0,1196);r12=0;while(1){r35=((HEAP8[r11+r12|0]&15)<<2)+r6|0;HEAP32[r35>>2]=HEAP32[r35>>2]+1;r35=r12+1|0;if((r35|0)<299){r12=r35}else{break}}r12=r11|0;r35=r14>>2;HEAP32[r23]=0;HEAP32[r3+1056881]=0;HEAP32[r3+1056897]=0;HEAP32[r26]=0;r10=1;r38=0;r39=0;r13=0;while(1){r36=HEAP32[(r10<<2>>2)+r7];r37=r36+r38<<1;r27=r37<<15-r10;HEAP32[((r10<<2)+4>>2)+r35]=(r27|0)>65535?65535:r27;r27=r39+r13|0;HEAP32[((r10<<2)+68>>2)+r35]=r27;HEAP32[(r10<<2>>2)+r9]=r27;r34=r10+1|0;if((r34|0)<16){r10=r34;r38=r37;r39=r27;r13=r36}else{r40=0;break}}while(1){r13=HEAP8[r11+r40|0];if(r13<<24>>24!=0){r39=((r13&15)<<2)+r8|0;r13=HEAP32[r39>>2];HEAP32[r39>>2]=r13+1;HEAP32[((r13<<2)+132>>2)+r35]=r40}r13=r40+1|0;if((r13|0)<299){r40=r13}else{break}}HEAP32[r14>>2]=299;r14=r2+4228848|0;_memset(r18,0,64);_memset(r2+4228980|0,0,240);r40=0;while(1){r35=((HEAP8[r40+(r11+299)|0]&15)<<2)+r6|0;HEAP32[r35>>2]=HEAP32[r35>>2]+1;r35=r40+1|0;if((r35|0)<60){r40=r35}else{break}}r40=r14>>2;HEAP32[r23]=0;HEAP32[r3+1057213]=0;HEAP32[r3+1057229]=0;HEAP32[r26]=0;r35=1;r13=0;r39=0;r38=0;while(1){r10=HEAP32[(r35<<2>>2)+r7];r36=r10+r13<<1;r27=r36<<15-r35;HEAP32[((r35<<2)+4>>2)+r40]=(r27|0)>65535?65535:r27;r27=r39+r38|0;HEAP32[((r35<<2)+68>>2)+r40]=r27;HEAP32[(r35<<2>>2)+r9]=r27;r37=r35+1|0;if((r37|0)<16){r35=r37;r13=r36;r39=r27;r38=r10}else{r41=0;break}}while(1){r38=HEAP8[r41+(r11+299)|0];if(r38<<24>>24!=0){r39=((r38&15)<<2)+r8|0;r38=HEAP32[r39>>2];HEAP32[r39>>2]=r38+1;HEAP32[((r38<<2)+132>>2)+r40]=r41}r38=r41+1|0;if((r38|0)<60){r41=r38}else{break}}HEAP32[r14>>2]=60;r14=r2+4229220|0;_memset(r18,0,64);_memset(r2+4229352|0,0,68);r41=0;while(1){r40=((HEAP8[r41+(r11+359)|0]&15)<<2)+r6|0;HEAP32[r40>>2]=HEAP32[r40>>2]+1;r40=r41+1|0;if((r40|0)<17){r41=r40}else{break}}r41=r14>>2;HEAP32[r23]=0;HEAP32[r3+1057306]=0;HEAP32[r3+1057322]=0;HEAP32[r26]=0;r40=1;r38=0;r39=0;r13=0;while(1){r35=HEAP32[(r40<<2>>2)+r7];r10=r35+r38<<1;r27=r10<<15-r40;HEAP32[((r40<<2)+4>>2)+r41]=(r27|0)>65535?65535:r27;r27=r39+r13|0;HEAP32[((r40<<2)+68>>2)+r41]=r27;HEAP32[(r40<<2>>2)+r9]=r27;r36=r40+1|0;if((r36|0)<16){r40=r36;r38=r10;r39=r27;r13=r35}else{r42=0;break}}while(1){r13=HEAP8[r42+(r11+359)|0];if(r13<<24>>24!=0){r39=((r13&15)<<2)+r8|0;r13=HEAP32[r39>>2];HEAP32[r39>>2]=r13+1;HEAP32[((r13<<2)+132>>2)+r41]=r42}r13=r42+1|0;if((r13|0)<17){r42=r13}else{break}}HEAP32[r14>>2]=17;r14=r2+4229420|0;_memset(r18,0,64);_memset(r2+4229552|0,0,112);r18=0;while(1){r42=((HEAP8[r18+(r11+376)|0]&15)<<2)+r6|0;HEAP32[r42>>2]=HEAP32[r42>>2]+1;r42=r18+1|0;if((r42|0)<28){r18=r42}else{break}}r18=r14>>2;HEAP32[r23]=0;HEAP32[r3+1057356]=0;HEAP32[r3+1057372]=0;HEAP32[r26]=0;r26=1;r3=0;r23=0;r6=0;while(1){r42=HEAP32[(r26<<2>>2)+r7];r41=r42+r3<<1;r13=r41<<15-r26;HEAP32[((r26<<2)+4>>2)+r18]=(r13|0)>65535?65535:r13;r13=r23+r6|0;HEAP32[((r26<<2)+68>>2)+r18]=r13;HEAP32[(r26<<2>>2)+r9]=r13;r39=r26+1|0;if((r39|0)<16){r26=r39;r3=r41;r23=r13;r6=r42}else{r43=0;break}}while(1){r6=HEAP8[r43+(r11+376)|0];if(r6<<24>>24!=0){r23=((r6&15)<<2)+r8|0;r6=HEAP32[r23>>2];HEAP32[r23>>2]=r6+1;HEAP32[((r6<<2)+132>>2)+r18]=r43}r6=r43+1|0;if((r6|0)<28){r43=r6}else{break}}HEAP32[r14>>2]=28;r14=r2+4227116|0;_memcpy(r14,r12,404)|0;r17=1;STACKTOP=r5;return r17}else if(r4==1444){STACKTOP=r5;return r17}else if(r4==1445){STACKTOP=r5;return r17}}function _unp_write_buf(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44;r2=(r1+4227088|0)>>2;r3=HEAP32[r2];r4=(r1+4227084|0)>>2;r5=(r1+4249520|0)>>2;L1958:do{if((HEAP32[r5]|0)==0){r6=r3}else{r7=(r1+4249516|0)>>2;r8=r1+4249556|0;r9=(r1+4249536|0)>>2;r10=(r1|0)>>2;r11=(r1+4249596|0)>>2;r12=r1+32772|0;r13=HEAP32[r4]-r3&4194303;r14=r3;r15=0;L1960:while(1){r16=HEAP32[HEAP32[r7]+(r15<<2)>>2],r17=r16>>2;do{if((r16|0)==0){r18=r15;r19=r14;r20=r13}else{r21=r16+12|0;if((HEAP32[r21>>2]|0)!=0){HEAP32[r21>>2]=0;r18=r15;r19=r14;r20=r13;break}r21=HEAP32[r17];r22=HEAP32[r17+1];r23=r21-r14|0;if((r23&4194303)>>>0>=r13>>>0){r18=r15;r19=r14;r20=r13;break}if((r14|0)==(r21|0)){r24=r14;r25=r13}else{r26=r1+(r14+32772)|0;if(r21>>>0<r14>>>0){r27=-r14&4194303;_write(HEAP32[r10],r26,r27);HEAP32[r9]=_i64Add(HEAP32[r9],HEAP32[r9+1],r27,0);HEAP32[r9+1]=tempRet0;HEAP32[r11]=_rar_crc(HEAP32[r11],r26,r27);_write(HEAP32[r10],r12,r21);HEAP32[r9]=_i64Add(HEAP32[r9],HEAP32[r9+1],r21,(r21|0)<0?-1:0);HEAP32[r9+1]=tempRet0;r28=_rar_crc(HEAP32[r11],r12,r21)}else{_write(HEAP32[r10],r26,r23);HEAP32[r9]=_i64Add(HEAP32[r9],HEAP32[r9+1],r23,(r23|0)<0?-1:0);HEAP32[r9+1]=tempRet0;r28=_rar_crc(HEAP32[r11],r26,r23)}HEAP32[r11]=r28;r24=r21;r25=HEAP32[r4]-r21&4194303}if(r22>>>0>r25>>>0){break L1960}r23=r22+r21|0;r26=r23&4194303;if(r21>>>0<r26>>>0|(r26|0)==0){_rarvm_set_memory(r8,0,r1+(r21+32772)|0,r22)}else{r22=4194303-r21|0;_rarvm_set_memory(r8,0,r1+(r21+32772)|0,r22);_rarvm_set_memory(r8,r22,r12,r26)}if((HEAP32[r17+10]|0)>0){HEAP32[r17+18]=HEAP32[r9];r22=r16+32|0;_rarvm_set_value(0,HEAP32[r22>>2]+36|0,HEAP32[r9]);_rarvm_set_value(0,HEAP32[r22>>2]+40|0,HEAP32[r9+1]);_rarvm_execute(r8,r16+16|0)}r22=HEAP32[r17+19];r27=HEAP32[r17+20];_rar_filter_delete(HEAP32[HEAP32[r7]+(r15<<2)>>2]);HEAP32[HEAP32[r7]+(r15<<2)>>2]=0;r29=r15+1|0;L1983:do{if(r29>>>0<HEAP32[r5]>>>0){r30=r27;r31=r22;r32=r15;r33=r29;while(1){r34=HEAP32[HEAP32[r7]+(r33<<2)>>2],r35=r34>>2;if((r34|0)==0){r36=r30;r37=r31;r38=r32;break L1983}if((HEAP32[r35]|0)!=(r21|0)){r36=r30;r37=r31;r38=r32;break L1983}if((HEAP32[r35+1]|0)!=(r30|0)){r36=r30;r37=r31;r38=r32;break L1983}if((HEAP32[r35+3]|0)!=0){r36=r30;r37=r31;r38=r32;break L1983}_rarvm_set_memory(r8,0,r31,r30);r35=HEAP32[HEAP32[r7]+(r33<<2)>>2],r34=r35>>2;if((HEAP32[r34+10]|0)>0){HEAP32[r34+18]=HEAP32[r9];r39=r35+32|0;_rarvm_set_value(0,HEAP32[r39>>2]+36|0,HEAP32[r9]);_rarvm_set_value(0,HEAP32[r39>>2]+40|0,HEAP32[r9+1]);_rarvm_execute(r8,r35+16|0);r40=HEAP32[HEAP32[r7]+(r33<<2)>>2]}else{r40=r35}r35=HEAP32[r34+19];r39=HEAP32[r34+20];_rar_filter_delete(r40);HEAP32[HEAP32[r7]+(r33<<2)>>2]=0;r34=r33+1|0;if(r34>>>0<HEAP32[r5]>>>0){r30=r39;r31=r35;r32=r33;r33=r34}else{r36=r39;r37=r35;r38=r33;break}}}else{r36=r27;r37=r22;r38=r15}}while(0);_write(HEAP32[r10],r37,r36);HEAP32[r9]=_i64Add(HEAP32[r9],HEAP32[r9+1],r36,(r36|0)<0?-1:0);HEAP32[r9+1]=tempRet0;HEAP32[r11]=_rar_crc(HEAP32[r11],r37,r36);r18=r38;r19=r26;r20=HEAP32[r4]-r23&4194303}}while(0);r17=r18+1|0;if(r17>>>0<HEAP32[r5]>>>0){r13=r20;r14=r19;r15=r17}else{r6=r19;break L1958}}r14=HEAP32[r5];if(r15>>>0<r14>>>0){r41=r15;r42=r14}else{r43=r24;HEAP32[r2]=r43;return}while(1){r14=HEAP32[HEAP32[r7]+(r41<<2)>>2];do{if((r14|0)==0){r44=r42}else{r13=r14+12|0;if((HEAP32[r13>>2]|0)==0){r44=r42;break}HEAP32[r13>>2]=0;r44=HEAP32[r5]}}while(0);r14=r41+1|0;if(r14>>>0<r44>>>0){r41=r14;r42=r44}else{r43=r24;break}}HEAP32[r2]=r43;return}}while(0);r24=HEAP32[r4];r44=r1+(r6+32772)|0;if(r24>>>0<r6>>>0){r42=-r6&4194303;r41=r1|0;_write(HEAP32[r41>>2],r44,r42);r5=(r1+4249536|0)>>2;HEAP32[r5]=_i64Add(HEAP32[r5],HEAP32[r5+1],r42,0);HEAP32[r5+1]=tempRet0;r19=(r1+4249596|0)>>2;HEAP32[r19]=_rar_crc(HEAP32[r19],r44,r42);r42=r1+32772|0;_write(HEAP32[r41>>2],r42,r24);HEAP32[r5]=_i64Add(HEAP32[r5],HEAP32[r5+1],r24,(r24|0)<0?-1:0);HEAP32[r5+1]=tempRet0;HEAP32[r19]=_rar_crc(HEAP32[r19],r42,r24)}else{r42=r24-r6|0;_write(HEAP32[r1>>2],r44,r42);r6=(r1+4249536|0)>>2;HEAP32[r6]=_i64Add(HEAP32[r6],HEAP32[r6+1],r42,(r42|0)<0?-1:0);HEAP32[r6+1]=tempRet0;r6=r1+4249596|0;HEAP32[r6>>2]=_rar_crc(HEAP32[r6>>2],r44,r42)}r43=HEAP32[r4];HEAP32[r2]=r43;return}function _add_vm_code(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r5=r1>>2;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+16|0;r8=r7;HEAP32[r8>>2]=r3;r3=(r8+4|0)>>2;HEAP32[r3]=r4;r4=r8+8|0;HEAP32[r4>>2]=0;HEAP32[r8+12>>2]=0;do{if((r2&128|0)==0){r9=HEAP32[r5+1062382];r6=1495}else{r10=_rarvm_read_data(r8);if((r10|0)!=0){r9=r10-1|0;r6=1495;break}r10=r1+4249524|0;r11=HEAP32[r10>>2];if((r11|0)!=0){_free(r11);HEAP32[r10>>2]=0}HEAP32[r5+1062383]=0;HEAP32[r5+1062382]=0;_rar_filter_array_reset(r1+4249508|0);_rar_filter_array_reset(r1+4249516|0);r10=r1+4249512|0;r12=HEAP32[r10>>2];r13=r10;r14=0;r15=r1+4249532|0,r16=r15>>2}}while(0);do{if(r6==1495){r10=r1+4249512|0;r11=HEAP32[r10>>2];if(r9>>>0>r11>>>0){r17=0;STACKTOP=r7;return r17}r18=r1+4249532|0;if(r9>>>0>HEAP32[r18>>2]>>>0){r17=0}else{r12=r11;r13=r10;r14=r9;r15=r18,r16=r15>>2;break}STACKTOP=r7;return r17}}while(0);r15=r1+4249508|0;HEAP32[r5+1062382]=r14;r9=(r14|0)==(r12|0);do{if(r9){if((_rar_filter_array_add(r15,1)|0)==0){r17=0;STACKTOP=r7;return r17}r12=_rar_filter_new();r18=r15|0;HEAP32[HEAP32[r18>>2]+(HEAP32[r13>>2]-1<<2)>>2]=r12;if((HEAP32[HEAP32[r18>>2]+(HEAP32[r13>>2]-1<<2)>>2]|0)==0){r17=0;STACKTOP=r7;return r17}r18=HEAP32[r16]+1|0;HEAP32[r16]=r18;r10=r1+4249524|0;r11=_realloc(HEAP32[r10>>2],r18<<2);r18=r11;HEAP32[r10>>2]=r18;if((r11|0)==0){r17=0;STACKTOP=r7;return r17}else{HEAP32[r18+(HEAP32[r16]-1<<2)>>2]=0;HEAP32[r12+8>>2]=0;r19=r12,r20=r19>>2;break}}else{r12=HEAP32[HEAP32[r15>>2]+(r14<<2)>>2];r18=r12+8|0;HEAP32[r18>>2]=HEAP32[r18>>2]+1;r19=r12,r20=r19>>2}}while(0);r15=_rar_filter_new(),r13=r15>>2;r12=r1+4249516|0;r18=(r1+4249520|0)>>2;if((HEAP32[r18]|0)==0){r6=1509}else{r11=r12|0;r10=0;r21=0;while(1){r22=HEAP32[r11>>2];HEAP32[r22+(r21-r10<<2)>>2]=HEAP32[r22+(r21<<2)>>2];r22=(r21<<2)+HEAP32[r11>>2]|0;r23=((HEAP32[r22>>2]|0)==0)+r10|0;if((r23|0)>0){HEAP32[r22>>2]=0}r22=r21+1|0;r24=HEAP32[r18];if(r22>>>0<r24>>>0){r10=r23;r21=r22}else{break}}if((r23|0)==0){r6=1509}else{r25=r23;r26=r24}}if(r6==1509){_rar_filter_array_add(r12,1);r25=1;r26=HEAP32[r18]}HEAP32[HEAP32[r12>>2]+(r26-r25<<2)>>2]=r15;r25=(r15+8|0)>>2;HEAP32[r25]=HEAP32[r20+2];r26=_rarvm_read_data(r8);r12=(r2&64|0)==0?r26:r26+258|0;r26=r1+4227084|0;HEAP32[r13]=r12+HEAP32[r26>>2]&4194303;if((r2&32|0)==0){if(r14>>>0<HEAP32[r16]>>>0){r27=HEAP32[HEAP32[r5+1062381]+(r14<<2)>>2]}else{r27=0}HEAP32[r13+1]=r27;r28=r27}else{r27=_rarvm_read_data(r8);HEAP32[r13+1]=r27;r28=r27}r27=r15+4|0;r16=HEAP32[r5+1056772];r18=HEAP32[r26>>2];if((r16|0)==(r18|0)){r29=0}else{r29=(r16-r18&4194303)>>>0<=r12>>>0|0}HEAP32[r13+3]=r29;HEAP32[HEAP32[r5+1062381]+(r14<<2)>>2]=r28;r28=(r15+48|0)>>2;HEAP32[r28]=0;HEAP32[r28+1]=0;HEAP32[r28+2]=0;HEAP32[r28+3]=0;HEAP32[r28+4]=0;HEAP32[r28+5]=0;HEAP32[r28+6]=0;r28=(r15+60|0)>>2;HEAP32[r28]=245760;r14=(r15+64|0)>>2;HEAP32[r14]=HEAP32[r27>>2];r5=(r15+68|0)>>2;HEAP32[r5]=HEAP32[r25];do{if((r2&16|0)!=0){r29=_rarvm_getbits(r8)>>>9;_rarvm_addbits(r8,7);if((r29&1|0)!=0){HEAP32[r13+12]=_rarvm_read_data(r8)}if((r29&2|0)!=0){HEAP32[r13+13]=_rarvm_read_data(r8)}if((r29&4|0)!=0){HEAP32[r13+14]=_rarvm_read_data(r8)}if((r29&8|0)!=0){HEAP32[r28]=_rarvm_read_data(r8)}if((r29&16|0)!=0){HEAP32[r14]=_rarvm_read_data(r8)}if((r29&32|0)!=0){HEAP32[r5]=_rarvm_read_data(r8)}if((r29&64|0)==0){break}HEAP32[r13+18]=_rarvm_read_data(r8)}}while(0);do{if(r9){r29=_rarvm_read_data(r8);if((r29|0)>4095|(r29|0)==0){r17=0;STACKTOP=r7;return r17}if((r29|0)>(HEAP32[r3]|0)){r17=0;STACKTOP=r7;return r17}r12=_malloc(r29);if((r12|0)==0){r17=0;STACKTOP=r7;return r17}if((r29|0)>0){r18=0;while(1){HEAP8[r12+r18|0]=_rarvm_getbits(r8)>>>8&255;_rarvm_addbits(r8,8);r16=r18+1|0;if((r16|0)<(r29|0)){r18=r16}else{break}}}r18=(_rarvm_prepare(r1+4249556|0,r8,r12,r29,r19+16|0)|0)==0;_free(r12);if(r18){r17=0}else{break}STACKTOP=r7;return r17}}while(0);HEAP32[r13+6]=HEAP32[r20+4];HEAP32[r13+7]=HEAP32[r20+7];r19=HEAP32[r20+11];do{if((r19-1|0)>>>0<8191){r1=_malloc(r19);HEAP32[r13+9]=r1;if((r1|0)==0){r17=0;STACKTOP=r7;return r17}else{r9=HEAP32[r20+9];_memcpy(r1,r9,r19)|0;break}}}while(0);r19=(r15+40|0)>>2;r20=(r15+32|0)>>2;do{if((HEAP32[r19]|0)<64){_free(HEAP32[r20]);r15=_malloc(64);HEAP32[r20]=r15;if((r15|0)==0){r17=0;STACKTOP=r7;return r17}else{_memset(r15,0,64);HEAP32[r19]=64;break}}}while(0);r15=HEAP32[r20];_rarvm_set_value(0,r15,HEAP32[r13+12]);_rarvm_set_value(0,r15+4|0,HEAP32[r13+13]);_rarvm_set_value(0,r15+8|0,HEAP32[r13+14]);_rarvm_set_value(0,r15+12|0,HEAP32[r28]);_rarvm_set_value(0,r15+16|0,HEAP32[r14]);_rarvm_set_value(0,r15+20|0,HEAP32[r5]);_rarvm_set_value(0,r15+24|0,HEAP32[r13+18]);_rarvm_set_value(0,r15+28|0,HEAP32[r27>>2]);_rarvm_set_value(0,r15+32|0,0);_rarvm_set_value(0,r15+44|0,HEAP32[r25]);_memset(r15+48|0,0,16);if((r2&8|0)==0){r17=1;STACKTOP=r7;return r17}r2=_rarvm_read_data(r8);if((r2|0)>65535){r17=0;STACKTOP=r7;return r17}r15=r2+64|0;do{if(HEAP32[r19]>>>0<r15>>>0){HEAP32[r19]=r15;r25=_realloc(HEAP32[r20],r15);HEAP32[r20]=r25;if((r25|0)==0){r17=0}else{r30=r25;break}STACKTOP=r7;return r17}else{r30=HEAP32[r20]}}while(0);if((r2|0)>0){r31=0}else{r17=1;STACKTOP=r7;return r17}while(1){if((HEAP32[r4>>2]+2|0)>(HEAP32[r3]|0)){r17=0;r6=1558;break}HEAP8[r31+(r30+64)|0]=_rarvm_getbits(r8)>>>8&255;_rarvm_addbits(r8,8);r20=r31+1|0;if((r20|0)<(r2|0)){r31=r20}else{r17=1;r6=1556;break}}if(r6==1556){STACKTOP=r7;return r17}else if(r6==1558){STACKTOP=r7;return r17}}function _urarlib_get(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11;r6=0;while(1){r7=r6>>>1;r8=(r6&1|0)!=0?r7^-306674912:r7;r7=r8>>>1;r9=(r8&1|0)!=0?r7^-306674912:r7;r7=r9>>>1;r8=(r9&1|0)!=0?r7^-306674912:r7;r7=r8>>>1;r9=(r8&1|0)!=0?r7^-306674912:r7;r7=r9>>>1;r8=(r9&1|0)!=0?r7^-306674912:r7;r7=r8>>>1;r9=(r8&1|0)!=0?r7^-306674912:r7;r7=r9>>>1;r8=(r9&1|0)!=0?r7^-306674912:r7;r7=r8>>>1;HEAP32[(r6<<2)+20552>>2]=(r8&1|0)!=0?r7^-306674912:r7;r7=r6+1|0;if((r7|0)<256){r6=r7}else{break}}r6=HEAP32[5544];if((r6|0)!=0){_free(r6)}HEAP32[5544]=_strdup(r3);r3=HEAP32[5546];if((r3|0)!=0){_free(r3)}HEAP32[5546]=_strdup(r4);r4=HEAP32[1444];if((r4|0)!=0){_free(r4)}if((r5|0)==0){r10=_strdup(3664)}else{r10=_strdup(r5)}HEAP32[1444]=r10;HEAP32[644]=0;HEAP32[642]=r2;r10=_ExtrFile();r5=HEAP32[1444];if((r5|0)!=0){_free(r5)}HEAP32[1444]=_strdup(3664);r5=HEAP32[654];if((r5|0)!=0){_fclose(r5);HEAP32[654]=0}r5=HEAP32[1304];if((r5|0)!=0){_free(r5)}r5=HEAP32[1312];if((r5|0)!=0){_free(r5)}r5=HEAP32[5134];if((r5|0)!=0){_free(r5)}HEAP32[1304]=0;HEAP32[1312]=0;HEAP32[5134]=0;r5=r10&1;if(r10){r11=HEAP32[644];HEAP32[r1>>2]=r11;return r5}r10=HEAP32[644];if((r10|0)!=0){_free(r10)}HEAP32[644]=0;HEAP32[r1>>2]=0;HEAP32[r2>>2]=0;r11=HEAP32[644];HEAP32[r1>>2]=r11;return r5}function _ExtrFile(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r1=0;r2=STACKTOP;STACKTOP=STACKTOP+64|0;r3=r2;HEAP8[20128]=0;r4=_fopen(HEAP32[5546],1920);HEAP32[654]=r4;if((r4|0)==0){r5=0;STACKTOP=r2;return r5}do{if((_fread(2608,1,7,r4)|0)==7){if(!((tempInt=HEAPU8[2608]|HEAPU8[2609|0]<<8,tempInt<<16>>16)<<16>>16==24914&(HEAP8[2610]|0)==114&(tempInt=HEAPU8[2611]|HEAPU8[2612|0]<<8,tempInt<<16>>16)<<16>>16==6689&(tempInt=HEAPU8[2613]|HEAPU8[2614|0]<<8,tempInt<<16>>16)<<16>>16==7)){_fwrite(1800,114,1,HEAP32[_stderr>>2]);break}if((_ReadHeader(115)|0)!=13){break}r6=_malloc(1048576);HEAP32[1304]=r6;if((r6|0)==0){r5=0;STACKTOP=r2;return r5}_fseek(HEAP32[654],((tempInt=HEAPU8[3653]|HEAPU8[3654|0]<<8,tempInt<<16>>16)&65535)-13|0,1);L2184:while(1){if((_ReadBlock(32884)|0)<1|(HEAP8[21578]|0)==119){r7=0;break}r6=(_stricomp(HEAP32[5544],HEAP32[5548])|0)==0;HEAP8[20128]=r6&1;if(r6){HEAP32[644]=_malloc(HEAP32[1467]);HEAP32[HEAP32[642]>>2]=0;if((HEAP32[644]|0)==0){r7=0;break}}if(((tempInt=HEAPU8[3651]|HEAPU8[3652|0]<<8,tempInt<<16>>16)&8)==0){if((HEAP8[20128]&1)!=0){r1=1612}}else{r1=1612}do{if(r1==1612){r1=0;r8=HEAP8[5884];if((r8-13&255)>16){r1=1613;break L2184}HEAP32[5126]=0;HEAP32[5128]=0;r6=HEAP32[1444];do{if((HEAP8[r6]|0)==0){r1=1616}else{if((HEAP16[2930]&4)==0){r1=1616;break}HEAP32[5034]=r8&255;if(r8<<24>>24==0){break}_SetCryptKeys(r6)}}while(0);if(r1==1616){r1=0;HEAP32[5034]=0}r6=HEAP32[1466];HEAP32[1044]=r6;r9=HEAP32[1467];HEAP32[5038]=r9;do{if((HEAP8[5885]|0)==48){r10=HEAP32[644];do{if((r9|0)==0){r11=0;r1=1623}else{r12=HEAP32[654];if((r12|0)==0){r13=0;break}r14=_fread(r10,1,r6>>>0<r9>>>0?r6:r9,r12);HEAP32[5128]=HEAP32[5128]+r14;HEAP32[1044]=HEAP32[1044]-r14;r11=r14;r1=1623}}while(0);do{if(r1==1623){r1=0;if((r11|0)==-1|(HEAP32[5034]|0)<20){r13=r11;break}if((r11|0)==0){r13=0;break}else{r15=0}while(1){_DecryptBlock(r10+r15|0);r14=r15+16|0;if(r14>>>0<r11>>>0){r15=r14}else{r13=r11;break}}}}while(0);HEAP32[HEAP32[642]>>2]=r13}else{if((HEAP8[5884]|0)==29){_Unpack29(HEAP32[654],r9,r6,HEAPU16[2930]);break}else{_Unpack(HEAP32[1304]);break}}}while(0);r6=HEAP32[644];if((r6|0)==0){break}r9=HEAP32[1469];r10=HEAP32[1467];if((r10|0)==0){r16=0}else{r14=-1;r12=0;while(1){r17=HEAP32[((HEAPU8[r6+r12|0]^r14&255)<<2)+20552>>2]^r14>>>8;r18=r12+1|0;if(r18>>>0<r10>>>0){r14=r17;r12=r18}else{break}}r16=~r17}if((r9|0)!=(r16|0)){r7=0;break L2184}}}while(0);r12=HEAP32[654];if((r12|0)!=0){_fseek(r12,HEAP32[1462],0)}if((_stricomp(HEAP32[5544],HEAP32[5548])|0)==0){r7=1;break}}if(r1==1613){_snprintf(r3|0,64,1768,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r8&255,tempInt));r7=0}_free(HEAP32[1304]);HEAP32[1304]=0;r12=HEAP32[654];if((r12|0)==0){r5=r7;STACKTOP=r2;return r5}_fclose(r12);HEAP32[654]=0;r5=r7;STACKTOP=r2;return r5}}while(0);_fclose(HEAP32[654]);HEAP32[654]=0;r5=0;STACKTOP=r2;return r5}function _urarlib_list(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;while(1){r4=r3>>>1;r5=(r3&1|0)!=0?r4^-306674912:r4;r4=r5>>>1;r6=(r5&1|0)!=0?r4^-306674912:r4;r4=r6>>>1;r5=(r6&1|0)!=0?r4^-306674912:r4;r4=r5>>>1;r6=(r5&1|0)!=0?r4^-306674912:r4;r4=r6>>>1;r5=(r6&1|0)!=0?r4^-306674912:r4;r4=r5>>>1;r6=(r5&1|0)!=0?r4^-306674912:r4;r4=r6>>>1;r5=(r6&1|0)!=0?r4^-306674912:r4;r4=r5>>>1;HEAP32[(r3<<2)+20552>>2]=(r5&1|0)!=0?r4^-306674912:r4;r4=r3+1|0;if((r4|0)<256){r3=r4}else{break}}r3=_fopen(r1,1920);HEAP32[654]=r3;if((r3|0)==0){r7=0;return r7}do{if((_fread(2608,1,7,r3)|0)==7){if(!((tempInt=HEAPU8[2608]|HEAPU8[2609|0]<<8,tempInt<<16>>16)<<16>>16==24914&(HEAP8[2610]|0)==114&(tempInt=HEAPU8[2611]|HEAPU8[2612|0]<<8,tempInt<<16>>16)<<16>>16==6689&(tempInt=HEAPU8[2613]|HEAPU8[2614|0]<<8,tempInt<<16>>16)<<16>>16==7)){_fwrite(1800,114,1,HEAP32[_stderr>>2]);break}if((_ReadHeader(115)|0)!=13){break}r1=_malloc(1048576);HEAP32[1304]=r1;if((r1|0)==0){r7=0;return r7}_fseek(HEAP32[654],((tempInt=HEAPU8[3653]|HEAPU8[3654|0]<<8,tempInt<<16>>16)&65535)-13|0,1);HEAP32[r2>>2]=0;if((_ReadBlock(32884)|0)<1|(HEAP8[21578]|0)==119){r8=0}else{r1=0;r4=0;while(1){r5=(HEAP32[r2>>2]|0)==0;r6=_malloc(40);r9=r6;if(r5){HEAP32[r6+36>>2]=0;HEAP32[r2>>2]=r9}else{HEAP32[r1+36>>2]=r9;HEAP32[r6+36>>2]=0}r5=_malloc(HEAPU16[2943]+1|0);HEAP32[r6>>2]=r5;_strcpy(r5,HEAP32[5548]);HEAP16[r6+4>>1]=HEAP16[2943];HEAP32[r6+8>>2]=HEAP32[1466];HEAP32[r6+12>>2]=HEAP32[1467];HEAP8[r6+16|0]=HEAP8[5872];HEAP32[r6+20>>2]=HEAP32[1469];HEAP32[r6+24>>2]=HEAP32[1470];HEAP8[r6+28|0]=HEAP8[5884];HEAP8[r6+29|0]=HEAP8[5885];HEAP32[r6+32>>2]=HEAP32[1472];r6=r4+1|0;r5=HEAP32[654];if((r5|0)!=0){_fseek(r5,HEAP32[1462],0)}if((_ReadBlock(32884)|0)<1|(HEAP8[21578]|0)==119){r8=r6;break}else{r1=r9;r4=r6}}}r4=HEAP32[1444];if((r4|0)!=0){_free(r4)}HEAP32[1444]=_strdup(3664);r4=HEAP32[654];if((r4|0)!=0){_fclose(r4);HEAP32[654]=0}r4=HEAP32[1304];if((r4|0)!=0){_free(r4)}r4=HEAP32[1312];if((r4|0)!=0){_free(r4)}r4=HEAP32[5134];if((r4|0)!=0){_free(r4)}HEAP32[1304]=0;HEAP32[1312]=0;HEAP32[5134]=0;r7=r8;return r7}}while(0);_fclose(HEAP32[654]);HEAP32[654]=0;r7=0;return r7}function _ReadBlock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+56|0;r4=r3+48;r5=r3;_memcpy(r5,5856,44)|0;r6=r1&255;HEAP32[5132]=_ftell(HEAP32[654]);r7=_ReadHeader(116);L2283:do{if((r7|0)==0){r8=1;r9=0;r10=r1&255}else{r11=(r6|0)==0;r12=r1&255;r13=(r1&32768|0)!=0;if((r6|0)==119){r14=r7;while(1){r15=HEAP16[2931];if((r15&65535)<7){r16=0;r2=1729;break}r17=HEAP32[5132];r18=r17+(r15&65535)|0;HEAP32[1462]=r18;if((HEAP16[2930]|0)<0){r15=HEAP32[1466]+r18|0;HEAP32[1462]=r15;r19=r15}else{r19=r18}if((r19|0)<=(r17|0)){r16=0;r2=1733;break}r17=(r14|0)<1;if(r11){r8=r17;r9=r14;r10=r12;break L2283}r18=HEAP8[5858];if(r18<<24>>24==r12<<24>>24){r8=r17;r9=r14;r10=r12;break L2283}if(r13&r18<<24>>24==119&(HEAP32[1380]|0)==119){r8=r17;r9=r14;r10=r12;break L2283}_fseek(HEAP32[654],r19,0);HEAP32[5132]=_ftell(HEAP32[654]);r17=_ReadHeader(116);if((r17|0)==0){r8=1;r9=0;r10=r12;break L2283}else{r14=r17}}if(r2==1733){STACKTOP=r3;return r16}else if(r2==1729){STACKTOP=r3;return r16}}if(r11){r14=HEAP16[2931];if((r14&65535)<7){r16=0;STACKTOP=r3;return r16}r17=HEAP32[5132];r18=r17+(r14&65535)|0;HEAP32[1462]=r18;if((HEAP16[2930]|0)<0){r14=HEAP32[1466]+r18|0;HEAP32[1462]=r14;r20=r14}else{r20=r18}if((r20|0)<=(r17|0)){r16=0;STACKTOP=r3;return r16}if((r7|0)<1){r8=1;r9=r7;r10=r12;break}HEAP32[1380]=0;r8=0;r9=r7;r10=r12;break}else{r21=r7}while(1){r17=HEAP16[2931];if((r17&65535)<7){r16=0;r2=1727;break}r18=HEAP32[5132];r14=r18+(r17&65535)|0;HEAP32[1462]=r14;if((HEAP16[2930]|0)<0){r17=HEAP32[1466]+r14|0;HEAP32[1462]=r17;r22=r17}else{r22=r14}if((r22|0)<=(r18|0)){r16=0;r2=1725;break}r18=(r21|0)<1;if(!r18){HEAP32[1380]=r6}r14=HEAP8[5858];if(r14<<24>>24==r12<<24>>24){r8=r18;r9=r21;r10=r12;break L2283}if(r13&r14<<24>>24==119&(HEAP32[1380]|0)==(r6|0)){r8=r18;r9=r21;r10=r12;break L2283}_fseek(HEAP32[654],r22,0);HEAP32[5132]=_ftell(HEAP32[654]);r18=_ReadHeader(116);if((r18|0)==0){r8=1;r9=0;r10=r12;break L2283}else{r21=r18}}if(r2==1725){STACKTOP=r3;return r16}else if(r2==1727){STACKTOP=r3;return r16}}}while(0);HEAP16[10788]=HEAP16[2928];r2=HEAP8[5858];HEAP8[21578]=r2;HEAP16[10790]=HEAP16[2930];HEAP16[10791]=HEAP16[2931];HEAP32[5396]=HEAP32[1466];if((r6|0)!=116|r2<<24>>24!=r10<<24>>24|r8){_memcpy(5856,r5,44)|0;_fseek(HEAP32[654],HEAP32[5132],0);r16=r9;STACKTOP=r3;return r16}r5=_realloc(HEAP32[5548],HEAPU16[2943]+1|0);HEAP32[5548]=r5;_fread(r5,1,HEAPU16[2943],HEAP32[654]);HEAP8[HEAP32[5548]+HEAPU16[2943]|0]=0;r5=HEAPU16[2943]+r9|0;r9=HEAP16[2930];do{if((r9&1024)==0){r23=r5;r24=r9}else{HEAP32[r4>>2]=0;HEAP32[r4+4>>2]=0;if((r5|0)>=(HEAPU16[2931]|0)){r23=r5;r24=r9;break}r23=_fread(r4,1,8,HEAP32[654])+r5|0;r24=HEAP16[2930]}}while(0);if((r24&4096)==0){r16=r23;STACKTOP=r3;return r16}if((r23|0)<(HEAPU16[2931]|0)){r25=(_fgetc(HEAP32[654])|_fgetc(HEAP32[654])<<8)&65535;r26=r23+2|0}else{r25=0;r26=r23}r23=r26;r26=0;while(1){r24=r26<<2;L2345:do{if((1<<15-r24&r25|0)==0){r27=r23}else{do{if((r26|0)==0){r28=r23}else{if((r23|0)>=(HEAPU16[2931]|0)){r28=r23;break}_fseek(HEAP32[654],4,1);r28=r23+4|0}}while(0);r5=r25>>>((12-r24|0)>>>0)&3;if((r5|0)==0){r27=r28;break}else{r29=r28;r30=1}while(1){if((r29|0)<(HEAPU16[2931]|0)){_fgetc(HEAP32[654]);r31=r29+1|0}else{r31=r29}if((r30|0)>=(r5|0)){r27=r31;break L2345}r29=r31;r30=r30+1|0}}}while(0);r24=r26+1|0;if((r24|0)<4){r23=r27;r26=r24}else{r16=r27;break}}STACKTOP=r3;return r16}function _urarlib_freelist(r1){var r2;if((r1|0)==0){return}else{r2=r1}while(1){r1=HEAP32[r2+36>>2];_free(HEAP32[r2>>2]);_free(r2);if((r1|0)==0){break}else{r2=r1}}return}function _ReadHeader(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+72|0;r3=r2;r4=r2+64;if((r1|0)==116){r5=r3|0;r6=_fread(r5,1,32,HEAP32[654]);HEAP16[2928]=HEAPU8[r3+1|0]<<8|HEAPU8[r5];HEAP8[5858]=HEAP8[r3+2|0];HEAP16[2930]=HEAPU8[r3+4|0]<<8|HEAPU8[r3+3|0];HEAP16[2931]=HEAPU8[r3+6|0]<<8|HEAPU8[r3+5|0];HEAP32[1466]=HEAPU8[r3+8|0]<<8|HEAPU8[r3+7|0]|HEAPU8[r3+9|0]<<16|HEAPU8[r3+10|0]<<24;HEAP32[1467]=HEAPU8[r3+12|0]<<8|HEAPU8[r3+11|0]|HEAPU8[r3+13|0]<<16|HEAPU8[r3+14|0]<<24;HEAP8[5872]=HEAP8[r3+15|0];HEAP32[1469]=HEAPU8[r3+17|0]<<8|HEAPU8[r3+16|0]|HEAPU8[r3+18|0]<<16|HEAPU8[r3+19|0]<<24;HEAP32[1470]=HEAPU8[r3+21|0]<<8|HEAPU8[r3+20|0]|HEAPU8[r3+22|0]<<16|HEAPU8[r3+23|0]<<24;HEAP8[5884]=HEAP8[r3+24|0];HEAP8[5885]=HEAP8[r3+25|0];HEAP16[2943]=HEAPU8[r3+27|0]<<8|HEAPU8[r3+26|0];HEAP32[1472]=HEAPU8[r3+29|0]<<8|HEAPU8[r3+28|0]|HEAPU8[r3+30|0]<<16|HEAPU8[r3+31|0]<<24;if((HEAP16[2930]&256)==0){r5=-1;r7=0;while(1){r8=HEAP32[((HEAPU8[r7+(r3+2)|0]^r5&255)<<2)+20552>>2]^r5>>>8;r9=r7+1|0;if(r9>>>0<30){r5=r8;r7=r9}else{break}}HEAP32[5030]=r8;HEAP32[1473]=0;HEAP32[1474]=0;r10=r6;STACKTOP=r2;return r10}r8=r4|0;r7=_fread(r8,1,8,HEAP32[654]);HEAP32[1473]=((HEAP8[r4+1|0]&65535)<<8)+(HEAP8[r4+2|0]<<16)+(HEAPU8[r4+3|0]<<24)+(HEAP8[r8]|0);HEAP32[1474]=((HEAP8[r4+5|0]&65535)<<8)+(HEAP8[r4+6|0]<<16)+(HEAPU8[r4+7|0]<<24)+(HEAP8[r4+4|0]|0);r4=-1;r8=0;while(1){r11=HEAP32[((HEAPU8[r8+(r3+2)|0]^r4&255)<<2)+20552>>2]^r4>>>8;r5=r8+1|0;if(r5>>>0<30){r4=r11;r8=r5}else{break}}HEAP32[5030]=r11;r10=r7+r6|0;STACKTOP=r2;return r10}else if((r1|0)==115){r1=r3|0;r6=_fread(r1,1,13,HEAP32[654]);tempBigInt=HEAPU8[r3+1|0]<<8|HEAPU8[r1];HEAP8[3648]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[3649|0]=tempBigInt&255;r1=HEAP8[r3+2|0];HEAP8[3650]=r1;r7=HEAP8[r3+3|0];r11=HEAP8[r3+4|0];tempBigInt=(r11&255)<<8|r7&255;HEAP8[3651]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[3652|0]=tempBigInt&255;r8=HEAP8[r3+5|0];r4=HEAP8[r3+6|0];tempBigInt=(r4&255)<<8|r8&255;HEAP8[3653]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[3654|0]=tempBigInt&255;r5=HEAP8[r3+7|0];r9=HEAP8[r3+8|0];tempBigInt=(r9&255)<<8|r5&255;HEAP8[3655]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[3656|0]=tempBigInt&255;r12=HEAPU8[r3+9|0];r13=HEAPU8[r3+10|0];r14=HEAPU8[r3+11|0];r15=HEAPU8[r3+12|0];tempBigInt=r13<<8|r12|r14<<16|r15<<24;HEAP8[3657]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[3658|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[3659|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[3660|0]=tempBigInt&255;r3=HEAP32[((r1&255^255)<<2)+20552>>2]^16777215;r1=HEAP32[((r7&255^r3&255)<<2)+20552>>2]^r3>>>8;r3=HEAP32[((r11&255^r1&255)<<2)+20552>>2]^r1>>>8;r1=HEAP32[((r8&255^r3&255)<<2)+20552>>2]^r3>>>8;r3=HEAP32[((r4&255^r1&255)<<2)+20552>>2]^r1>>>8;r1=HEAP32[((r5&255^r3&255)<<2)+20552>>2]^r3>>>8;r3=HEAP32[((r9&255^r1&255)<<2)+20552>>2]^r1>>>8;r1=HEAP32[((r12^r3&255)<<2)+20552>>2]^r3>>>8;r3=HEAP32[((r13^r1&255)<<2)+20552>>2]^r1>>>8;r1=HEAP32[((r14^r3&255)<<2)+20552>>2]^r3>>>8;HEAP32[5030]=HEAP32[((r15^r1&255)<<2)+20552>>2]^r1>>>8;r10=r6;STACKTOP=r2;return r10}else{r10=0;STACKTOP=r2;return r10}}function _stricomp(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+1024|0;r4=r3|0;_strncpy(r4,r1,512);r1=r3+512|0;_strncpy(r1,r2,512);r2=_strchr(r4,92);if((r2|0)!=0){r5=r2;while(1){HEAP8[r5]=95;r2=_strchr(r4,92);if((r2|0)==0){break}else{r5=r2}}}r5=_strchr(r1,92);if((r5|0)!=0){r2=r5;while(1){HEAP8[r2]=95;r5=_strchr(r1,92);if((r5|0)==0){break}else{r2=r5}}}r2=_strchr(r4,47);if((r2|0)!=0){r5=r2;while(1){HEAP8[r5]=95;r2=_strchr(r4,47);if((r2|0)==0){break}else{r5=r2}}}r5=_strchr(r1,47);if((r5|0)==0){r6=_strcasecmp(r4,r1);STACKTOP=r3;return r6}else{r7=r5}while(1){HEAP8[r7]=95;r5=_strchr(r1,47);if((r5|0)==0){break}else{r7=r5}}r6=_strcasecmp(r4,r1);STACKTOP=r3;return r6}function _SetCryptKeys(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;STACKTOP=STACKTOP+256|0;r3=r2;_SetOldKeys(r1);HEAP32[2974]=-744245127;HEAP32[2975]=1064112887;HEAP32[2976]=1964352053;HEAP32[2977]=-1528303325;r4=r3|0;_memset(r4,0,256);_strcpy(r4,r1);r4=_strlen(r1);_memcpy(5256,2296,256)|0;r1=(r4|0)==0;r5=0;while(1){if(!r1){r6=0;while(1){r7=HEAP32[((HEAPU8[r3+r6|0]-r5&255)<<2)+20552>>2];r8=r7&255;r9=HEAP32[((HEAPU8[r3+(r6|1)|0]+r5&255)<<2)+20552>>2]&255;if((r8|0)!=(r9|0)){r10=1;r11=r7&255;r7=r8;while(1){r8=r7+5256|0;r12=HEAP8[r8];r13=(r10+r6+r7&255)+5256|0;HEAP8[r8]=HEAP8[r13];HEAP8[r13]=r12;r12=r11+1&255;r13=r12&255;if((r13|0)==(r9|0)){break}else{r10=r10+1|0;r11=r12;r7=r13}}}r7=r6+2|0;if(r7>>>0<r4>>>0){r6=r7}else{break}}}r6=r5+1|0;if(r6>>>0<256){r5=r6}else{break}}if(r1){STACKTOP=r2;return}else{r14=0}while(1){_EncryptBlock(r3+r14|0);r1=r14+16|0;if(r1>>>0<r4>>>0){r14=r1}else{break}}STACKTOP=r2;return}function _Unpack(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=0;HEAP32[1308]=r1;HEAP32[5026]=0;HEAP32[5028]=0;if((HEAP16[2930]&16)==0){HEAP32[5130]=0;HEAP32[5136]=0;_memset(21808,0,368);HEAP32[1456]=0;HEAP32[1457]=0;HEAP32[1458]=0;HEAP32[1459]=0;HEAP32[1454]=0;HEAP32[2638]=0;HEAP32[2640]=0;_memset(r1,0,1048576);_memset(4184,0,1028);HEAP32[1036]=0;HEAP32[1042]=0}r1=HEAP32[1044];r3=HEAP32[654];do{if((r3|0)==0){r4=0}else{r5=_fread(11912,1,r1>>>0<8192?r1:8192,r3);HEAP32[5128]=HEAP32[5128]+r5;HEAP32[1044]=HEAP32[1044]-r5;if((r5|0)==-1|(HEAP32[5034]|0)<20){r4=r5;break}if((r5|0)==0){r4=0;break}else{r6=0}while(1){_DecryptBlock(r6+11912|0);r7=r6+16|0;if(r7>>>0<r5>>>0){r6=r7}else{r4=r5;break}}}}while(0);HEAP32[1378]=r4;HEAP32[5028]=0;if((HEAP16[2930]&16)==0){_ReadTables()}r4=HEAP32[5038];HEAP32[5038]=r4-1;if((r4|0)>0){while(1){HEAP32[1042]=HEAP32[1042]&1048575;r4=HEAP32[5028];L2433:do{if(r4>>>0>8162){_memcpy(11912,20072,32)|0;HEAP32[5028]=r4&31;r6=HEAP32[1044];r3=HEAP32[654];do{if((r3|0)!=0){r1=_fread(11944,1,r6>>>0<8160?r6:8160,r3);HEAP32[5128]=HEAP32[5128]+r1;HEAP32[1044]=HEAP32[1044]-r1;if(!((r1|0)==-1|(HEAP32[5034]|0)<20)){if((r1|0)==0){break}else{r8=0}while(1){_DecryptBlock(r8+11944|0);r5=r8+16|0;if(r5>>>0<r1>>>0){r8=r5}else{break}}}if((r1|0)<=0){break}HEAP32[1378]=r1+32;break L2433}}while(0);HEAP32[1378]=HEAP32[5028]}}while(0);r4=HEAP32[1036];r3=HEAP32[1042];if(!((r4-r3&1048574)>>>0>269|(r4|0)==(r3|0))){do{if((HEAP8[20128]&1)!=0){r6=HEAP32[HEAP32[642]>>2];if(r3>>>0<r4>>>0){if((r6+r3|0)>>>0>HEAP32[1467]>>>0){HEAP32[5038]=-1;break}else{r5=HEAP32[644]+r6|0;r7=HEAP32[1308]+r4|0;r9=-r4&1048575;_memcpy(r5,r7,r9)|0;r9=HEAP32[642];HEAP32[r9>>2]=HEAP32[r9>>2]+(-HEAP32[1036]&1048575);r9=HEAP32[644]+HEAP32[HEAP32[642]>>2]|0;r7=HEAP32[1308];r5=HEAP32[1042];_memcpy(r9,r7,r5)|0;r5=HEAP32[642];HEAP32[r5>>2]=HEAP32[r5>>2]+HEAP32[1042];break}}else{r5=r3-r4|0;if((r6+r5|0)>>>0>HEAP32[1467]>>>0){HEAP32[5038]=-1;break}else{r7=HEAP32[644]+r6|0;r6=HEAP32[1308]+r4|0;_memcpy(r7,r6,r5)|0;r5=HEAP32[642];HEAP32[r5>>2]=HEAP32[1042]-HEAP32[1036]+HEAP32[r5>>2];break}}}}while(0);HEAP32[1036]=HEAP32[1042]}L2460:do{if((HEAP32[1310]|0)==0){HEAP32[5040]=HEAP32[2642];HEAP32[5041]=10572;HEAP32[5042]=10636;HEAP32[5043]=10700;_DecodeNumber(20160);r4=HEAP32[1460];if(r4>>>0<256){r3=HEAP32[1042];HEAP32[1042]=r3+1;HEAP8[HEAP32[1308]+r3|0]=r4&255;r3=HEAP32[5038]-1|0;HEAP32[5038]=r3;r10=r3;break}if(r4>>>0>269){r3=r4-270|0;HEAP32[1460]=r3;r5=HEAPU8[r3+1976|0]+3|0;HEAP32[2636]=r5;r6=HEAPU8[r3+2008|0];if((r4-278|0)>>>0<20){r3=HEAP32[5028];r7=HEAP32[5026];r9=(HEAPU8[r3+11913|0]<<8|HEAPU8[r3+11912|0]<<16|HEAPU8[r3+11914|0])>>>((8-r7|0)>>>0)&65535;HEAP32[5398]=r9;HEAP32[2636]=(r9>>>((16-r6|0)>>>0))+r5;r5=r7+r6|0;HEAP32[5028]=(r5>>>3)+r3;HEAP32[5026]=r5&7}HEAP32[5040]=HEAP32[5044];HEAP32[5041]=20180;HEAP32[5042]=20244;HEAP32[5043]=20308;_DecodeNumber(20160);r5=HEAP32[1460];r3=HEAP32[(r5<<2)+2040>>2]+1|0;HEAP32[5036]=r3;r6=HEAPU8[r5+2232|0];if((r5-4|0)>>>0<44){r5=HEAP32[5028];r7=HEAP32[5026];r9=(HEAPU8[r5+11913|0]<<8|HEAPU8[r5+11912|0]<<16|HEAPU8[r5+11914|0])>>>((8-r7|0)>>>0)&65535;HEAP32[5398]=r9;r11=(r9>>>((16-r6|0)>>>0))+r3|0;HEAP32[5036]=r11;r9=r7+r6|0;HEAP32[5028]=(r9>>>3)+r5;HEAP32[5026]=r9&7;r12=r11}else{r12=r3}if(r12>>>0>262143){HEAP32[2636]=HEAP32[2636]+1}r3=HEAP32[2636];if(r12>>>0>8191){r11=r3+1|0;HEAP32[2636]=r11;r13=r11}else{r13=r3}r3=HEAP32[1454];HEAP32[1454]=r3+1;HEAP32[((r3&3)<<2)+5824>>2]=r12;HEAP32[2640]=r12;HEAP32[2638]=r13;HEAP32[5038]=HEAP32[5038]-r13;HEAP32[2636]=r13-1;if((r13|0)==0){r2=1784;break}r3=HEAP32[1042];r11=r12;while(1){r9=HEAP32[1308];HEAP8[r9+r3|0]=HEAP8[r9+(r3-r11&1048575)|0];r9=HEAP32[1042]+1&1048575;HEAP32[1042]=r9;r5=HEAP32[2636];HEAP32[2636]=r5-1;if((r5|0)==0){r2=1784;break L2460}r3=r9;r11=HEAP32[5036]}}if((r4|0)==269){_ReadTables();r2=1784;break}else if((r4|0)==256){r11=HEAP32[2638];r3=HEAP32[2640];HEAP32[5036]=r3;r9=HEAP32[1454];HEAP32[1454]=r9+1;HEAP32[((r9&3)<<2)+5824>>2]=r3;HEAP32[5038]=HEAP32[5038]-r11;HEAP32[2636]=r11-1;if((r11|0)==0){r2=1784;break}r11=HEAP32[1042];r9=r3;while(1){r3=HEAP32[1308];HEAP8[r3+r11|0]=HEAP8[r3+(r11-r9&1048575)|0];r3=HEAP32[1042]+1&1048575;HEAP32[1042]=r3;r5=HEAP32[2636];HEAP32[2636]=r5-1;if((r5|0)==0){r2=1784;break L2460}r11=r3;r9=HEAP32[5036]}}else{if(r4>>>0>=261){r9=r4-261|0;HEAP32[1460]=r9;r11=HEAPU8[r9+1960|0]+1|0;r3=HEAPU8[r9+1968|0];r9=HEAP32[5028];r5=HEAP32[5026];r6=(HEAPU8[r9+11913|0]<<8|HEAPU8[r9+11912|0]<<16|HEAPU8[r9+11914|0])>>>((8-r5|0)>>>0)&65535;HEAP32[5398]=r6;r7=(r6>>>((16-r3|0)>>>0))+r11|0;HEAP32[5036]=r7;r11=r5+r3|0;HEAP32[5028]=(r11>>>3)+r9;HEAP32[5026]=r11&7;r11=HEAP32[1454];HEAP32[1454]=r11+1;HEAP32[((r11&3)<<2)+5824>>2]=r7;HEAP32[2640]=r7;HEAP32[2638]=2;HEAP32[5038]=HEAP32[5038]-2;HEAP32[2636]=1;r11=HEAP32[1042];r9=r7;while(1){r7=HEAP32[1308];HEAP8[r7+r11|0]=HEAP8[r7+(r11-r9&1048575)|0];r7=HEAP32[1042]+1&1048575;HEAP32[1042]=r7;r3=HEAP32[2636];HEAP32[2636]=r3-1;if((r3|0)==0){r2=1784;break L2460}r11=r7;r9=HEAP32[5036]}}HEAP32[5036]=HEAP32[((HEAP32[1454]-r4&3)<<2)+5824>>2];HEAP32[5040]=HEAP32[1382];HEAP32[5041]=5532;HEAP32[5042]=5596;HEAP32[5043]=5660;_DecodeNumber(20160);r9=HEAP32[1460];r11=HEAPU8[r9+1976|0]+2|0;HEAP32[2636]=r11;r7=HEAPU8[r9+2008|0];if((r9-8|0)>>>0<20){r9=HEAP32[5028];r3=HEAP32[5026];r5=(HEAPU8[r9+11913|0]<<8|HEAPU8[r9+11912|0]<<16|HEAPU8[r9+11914|0])>>>((8-r3|0)>>>0)&65535;HEAP32[5398]=r5;r6=(r5>>>((16-r7|0)>>>0))+r11|0;HEAP32[2636]=r6;r5=r3+r7|0;HEAP32[5028]=(r5>>>3)+r9;HEAP32[5026]=r5&7;r14=r6}else{r14=r11}r11=HEAP32[5036];if(r11>>>0>262143){r6=r14+1|0;HEAP32[2636]=r6;r15=r6;r2=1835}else{if(r11>>>0>8191){r15=r14;r2=1835}else{r16=r14}}if(r2==1835){r2=0;r6=r15+1|0;HEAP32[2636]=r6;r16=r6}if(r11>>>0>256){r6=r16+1|0;HEAP32[2636]=r6;r17=r6}else{r17=r16}r6=HEAP32[1454];HEAP32[1454]=r6+1;HEAP32[((r6&3)<<2)+5824>>2]=r11;HEAP32[2640]=r11;HEAP32[2638]=r17;HEAP32[5038]=HEAP32[5038]-r17;HEAP32[2636]=r17-1;if((r17|0)==0){r2=1784;break}r6=HEAP32[1042];r5=r11;while(1){r11=HEAP32[1308];HEAP8[r11+r6|0]=HEAP8[r11+(r6-r5&1048575)|0];r11=HEAP32[1042]+1&1048575;HEAP32[1042]=r11;r9=HEAP32[2636];HEAP32[2636]=r9-1;if((r9|0)==0){r2=1784;break L2460}r6=r11;r5=HEAP32[5036]}}}else{_DecodeNumber(HEAP32[(HEAP32[5130]<<2)+2280>>2]);r5=HEAP32[1460];if((r5|0)==256){_ReadTables();r2=1784;break}else{r6=_DecodeAudio(r5);r5=HEAP32[1042];HEAP32[1042]=r5+1;HEAP8[HEAP32[1308]+r5|0]=r6;r6=HEAP32[5130]+1|0;HEAP32[5130]=(r6|0)==(HEAP32[1306]|0)?0:r6;r6=HEAP32[5038]-1|0;HEAP32[5038]=r6;r10=r6;break}}}while(0);if(r2==1784){r2=0;r10=HEAP32[5038]}if((r10|0)<=-1){break}}}do{if(HEAP32[1378]>>>0>=(HEAP32[5028]+5|0)>>>0){if((HEAP32[1310]|0)==0){HEAP32[5040]=HEAP32[2642];HEAP32[5041]=10572;HEAP32[5042]=10636;HEAP32[5043]=10700;_DecodeNumber(20160);if((HEAP32[1460]|0)!=269){break}_ReadTables();break}else{r10=HEAP32[(HEAP32[5130]<<2)+2280>>2];HEAP32[5040]=HEAP32[r10>>2];HEAP32[5041]=r10+4;HEAP32[5042]=r10+68;HEAP32[5043]=r10+132;_DecodeNumber(20160);if((HEAP32[1460]|0)!=256){break}_ReadTables();break}}}while(0);if((HEAP8[20128]&1)==0){r18=HEAP32[1042];HEAP32[1036]=r18;return}r10=HEAP32[1042];r2=HEAP32[1036];r17=HEAP32[HEAP32[642]>>2];if(r10>>>0<r2>>>0){if((r17+r10|0)>>>0>HEAP32[1467]>>>0){HEAP32[5038]=-1;r18=HEAP32[1042];HEAP32[1036]=r18;return}else{r16=HEAP32[644]+r17|0;r15=HEAP32[1308]+r2|0;r14=-r2&1048575;_memcpy(r16,r15,r14)|0;r14=HEAP32[642];HEAP32[r14>>2]=HEAP32[r14>>2]+(-HEAP32[1036]&1048575);r14=HEAP32[644]+HEAP32[HEAP32[642]>>2]|0;r15=HEAP32[1308];r16=HEAP32[1042];_memcpy(r14,r15,r16)|0;r16=HEAP32[642];HEAP32[r16>>2]=HEAP32[r16>>2]+HEAP32[1042];r18=HEAP32[1042];HEAP32[1036]=r18;return}}else{r16=r10-r2|0;if((r17+r16|0)>>>0>HEAP32[1467]>>>0){HEAP32[5038]=-1;r18=HEAP32[1042];HEAP32[1036]=r18;return}else{r10=HEAP32[644]+r17|0;r17=HEAP32[1308]+r2|0;_memcpy(r10,r17,r16)|0;r16=HEAP32[642];HEAP32[r16>>2]=HEAP32[1042]-HEAP32[1036]+HEAP32[r16>>2];r18=HEAP32[1042];HEAP32[1036]=r18;return}}}function _DecodeNumber(r1){var r2,r3,r4,r5,r6,r7;r2=HEAP32[5028];r3=HEAP32[5026];r4=(HEAPU8[r2+11913|0]<<8|HEAPU8[r2+11912|0]<<16|HEAPU8[r2+11914|0])>>>((8-r3|0)>>>0);HEAP32[5398]=r4&65535;r5=r4&65534;r4=r1+4|0;r6=HEAP32[r4>>2]>>2;do{if(r5>>>0<HEAP32[r6+8]>>>0){if(r5>>>0<HEAP32[r6+4]>>>0){if(r5>>>0<HEAP32[r6+2]>>>0){r7=r5>>>0<HEAP32[r6+1]>>>0?1:2;break}else{r7=r5>>>0<HEAP32[r6+3]>>>0?3:4;break}}else{if(r5>>>0<HEAP32[r6+6]>>>0){r7=r5>>>0<HEAP32[r6+5]>>>0?5:6;break}else{r7=r5>>>0<HEAP32[r6+7]>>>0?7:8;break}}}else{if(r5>>>0>=HEAP32[r6+12]>>>0){if(r5>>>0>=HEAP32[r6+14]>>>0){r7=15;break}r7=r5>>>0<HEAP32[r6+13]>>>0?13:14;break}if(r5>>>0<HEAP32[r6+10]>>>0){r7=r5>>>0<HEAP32[r6+9]>>>0?9:10;break}else{r7=r5>>>0<HEAP32[r6+11]>>>0?11:12;break}}}while(0);r6=r3+r7|0;HEAP32[5028]=(r6>>>3)+r2;HEAP32[5026]=r6&7;r6=((r5-HEAP32[HEAP32[r4>>2]+(r7-1<<2)>>2]|0)>>>((16-r7|0)>>>0))+HEAP32[HEAP32[r1+8>>2]+(r7<<2)>>2]|0;HEAP32[1460]=HEAP32[HEAP32[r1+12>>2]+((r6>>>0>=HEAP32[r1>>2]>>>0?0:r6)<<2)>>2];return}function _ReadTables(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r1=STACKTOP;STACKTOP=STACKTOP+1056|0;r2=r1;r3=r1+24;r4=HEAP32[5028];L2568:do{if(r4>>>0>8167){_memcpy(11912,20072,32)|0;HEAP32[5028]=r4&31;r5=HEAP32[1044];r6=HEAP32[654];do{if((r6|0)!=0){r7=_fread(11944,1,r5>>>0<8160?r5:8160,r6);HEAP32[5128]=HEAP32[5128]+r7;HEAP32[1044]=HEAP32[1044]-r7;if(!((r7|0)==-1|(HEAP32[5034]|0)<20)){if((r7|0)==0){break}else{r8=0}while(1){_DecryptBlock(r8+11944|0);r9=r8+16|0;if(r9>>>0<r7>>>0){r8=r9}else{break}}}if((r7|0)<=0){break}HEAP32[1378]=r7+32;r10=HEAP32[5028];break L2568}}while(0);r6=HEAP32[5028];HEAP32[1378]=r6;r10=r6}else{r10=r4}}while(0);r4=HEAP32[5026];r8=(HEAPU8[r10+11913|0]<<8|HEAPU8[r10+11912|0]<<16|HEAPU8[r10+11914|0])>>>((8-r4|0)>>>0);HEAP32[5398]=r8&65535;r6=r8&32768;HEAP32[1310]=r6;if((r8&16384|0)==0){_memset(4184,0,1028)}r5=r4+2|0;r9=(r5>>>3)+r10|0;HEAP32[5028]=r9;r10=r5&7;HEAP32[5026]=r10;if((r6|0)==0){r11=374;r12=r9;r13=r10}else{r6=(r8>>>12&3)+1|0;HEAP32[1306]=r6;if((HEAP32[5130]|0)>=(r6|0)){HEAP32[5130]=0}r8=((r10+2|0)>>>3)+r9|0;HEAP32[5028]=r8;r9=r4+4&7;HEAP32[5026]=r9;r11=r6*257&-1;r12=r8;r13=r9}r9=0;r8=r12;r12=r13;while(1){r14=(HEAPU8[r8+11913|0]<<8|HEAPU8[r8+11912|0]<<16|HEAPU8[r8+11914|0])>>>((8-r12|0)>>>0)&65535;HEAP8[r2+r9|0]=r14>>>12&255;r13=r12+4|0;r15=(r13>>>3)+r8|0;r16=r13&7;r13=r9+1|0;if((r13|0)<19){r9=r13;r8=r15;r12=r16}else{break}}HEAP32[5028]=r15;HEAP32[5026]=r16;HEAP32[5398]=r14;HEAP32[5040]=HEAP32[5400];HEAP32[5041]=21604;HEAP32[5042]=21668;HEAP32[5043]=21732;_MakeDecodeTables(r2|0,19);HEAP32[5400]=HEAP32[5040];if((r11|0)>0){r2=0;while(1){r14=HEAP32[5028];L2595:do{if(r14>>>0>8187){_memcpy(11912,20072,32)|0;HEAP32[5028]=r14&31;r16=HEAP32[1044];r15=HEAP32[654];do{if((r15|0)!=0){r12=_fread(11944,1,r16>>>0<8160?r16:8160,r15);HEAP32[5128]=HEAP32[5128]+r12;HEAP32[1044]=HEAP32[1044]-r12;if(!((r12|0)==-1|(HEAP32[5034]|0)<20)){if((r12|0)==0){break}else{r17=0}while(1){_DecryptBlock(r17+11944|0);r8=r17+16|0;if(r8>>>0<r12>>>0){r17=r8}else{break}}}if((r12|0)<=0){break}HEAP32[1378]=r12+32;break L2595}}while(0);HEAP32[1378]=HEAP32[5028]}}while(0);HEAP32[5040]=HEAP32[5400];HEAP32[5041]=21604;HEAP32[5042]=21668;HEAP32[5043]=21732;_DecodeNumber(20160);r14=HEAP32[1460];do{if(r14>>>0<16){HEAP8[r3+r2|0]=HEAPU8[r2+4184|0]+r14&15;r18=r2+1|0}else{if((r14|0)==16){r15=HEAP32[5028];r16=HEAP32[5026];r7=(HEAPU8[r15+11913|0]<<8|HEAPU8[r15+11912|0]<<16|HEAPU8[r15+11914|0])>>>((8-r16|0)>>>0);r8=r7&65535;HEAP32[5398]=r8;r9=r16+2|0;HEAP32[5028]=(r9>>>3)+r15;HEAP32[5026]=r9&7;if((r2|0)>=(r11|0)){r18=r2;break}r9=r2-r11|0;r15=r7>>>14&3;r7=-3-r15|0;r16=((r7|0)>-1?-4-r7|0:-3)-r15|0;r15=r9>>>0>r16>>>0?r9:r16;r16=(r8>>>14)+3|0;r8=r2;while(1){r9=r16-1|0;HEAP8[r3+r8|0]=HEAP8[r3+(r8-1)|0];r7=r8+1|0;if((r9|0)>0&(r7|0)<(r11|0)){r16=r9;r8=r7}else{break}}r18=r2-r15|0;break}r8=HEAP32[5028];r16=HEAP32[5026];r7=(HEAPU8[r8+11913|0]<<8|HEAPU8[r8+11912|0]<<16|HEAPU8[r8+11914|0])>>>((8-r16|0)>>>0)&65535;HEAP32[5398]=r7;if((r14|0)==17){r19=(r7>>>13)+3|0;r20=r16+3|0}else{r19=(r7>>>9)+11|0;r20=r16+7|0}HEAP32[5028]=(r20>>>3)+r8;HEAP32[5026]=r20&7;if(!((r19|0)>0&(r2|0)<(r11|0))){r18=r2;break}r8=-r19|0;r16=r2-r11|0;r7=r16>>>0<r8>>>0?r8:r16;_memset(r3+r2|0,0,-r7|0);r18=r2-r7|0}}while(0);if((r18|0)<(r11|0)){r2=r18}else{break}}}if((HEAP32[1310]|0)==0){r18=r3|0;HEAP32[5040]=HEAP32[2642];HEAP32[5041]=10572;HEAP32[5042]=10636;HEAP32[5043]=10700;_MakeDecodeTables(r18,298);HEAP32[2642]=HEAP32[5040];HEAP32[5040]=HEAP32[5044];HEAP32[5041]=20180;HEAP32[5042]=20244;HEAP32[5043]=20308;_MakeDecodeTables(r3+298|0,48);HEAP32[5044]=HEAP32[5040];HEAP32[5040]=HEAP32[1382];HEAP32[5041]=5532;HEAP32[5042]=5596;HEAP32[5043]=5660;_MakeDecodeTables(r3+346|0,28);HEAP32[1382]=HEAP32[5040];r21=r18;_memcpy(4184,r21,1028)|0;STACKTOP=r1;return}if((HEAP32[1306]|0)>0){r18=0;while(1){r2=HEAP32[(r18<<2)+2280>>2];r11=r2|0;HEAP32[5040]=HEAP32[r11>>2];HEAP32[5041]=r2+4;HEAP32[5042]=r2+68;HEAP32[5043]=r2+132;_MakeDecodeTables(r3+(r18*257&-1)|0,257);HEAP32[r11>>2]=HEAP32[5040];r11=r18+1|0;if((r11|0)<(HEAP32[1306]|0)){r18=r11}else{break}}}r21=r3|0;_memcpy(4184,r21,1028)|0;STACKTOP=r1;return}function _DecodeAudio(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r2=HEAP32[5130];r3=((r2*92&-1)+21892|0)>>2;HEAP32[r3]=HEAP32[r3]+1;r4=(r2*92&-1)+21836|0;r5=HEAP32[r4>>2];r6=(r2*92&-1)+21840|0;HEAP32[r6>>2]=r5;r7=(r2*92&-1)+21832|0;r8=HEAP32[r7>>2];HEAP32[r4>>2]=r8;r4=(r2*92&-1)+21844|0;r9=HEAP32[r4>>2];r10=(r2*92&-1)+21828|0;r11=r9-HEAP32[r10>>2]|0;HEAP32[r7>>2]=r11;HEAP32[r10>>2]=r9;r10=((r2*92&-1)+21896|0)>>2;r7=((r2*92&-1)+21808|0)>>2;r12=((r2*92&-1)+21812|0)>>2;r13=((r2*92&-1)+21816|0)>>2;r14=((r2*92&-1)+21820|0)>>2;r15=((((HEAP32[r10]<<3)+Math.imul(HEAP32[r7],r9)|0)+Math.imul(r11,HEAP32[r12])|0)+Math.imul(r8,HEAP32[r13])|0)+Math.imul(r5,HEAP32[r14])|0;r16=((r2*92&-1)+21824|0)>>2;r17=HEAP32[5136];r18=((r15+Math.imul(r17,HEAP32[r16])|0)>>>3&255)-r1|0;r15=r1<<24;r1=r15>>21;r19=(r2*92&-1)+21848|0;r20=HEAP32[r19>>2]+((r15|0)>-2097152?r1:-r1|0)|0;HEAP32[r19>>2]=r20;r15=r1-r9|0;r21=(r2*92&-1)+21852|0;r22=((r15|0)>-1?r15:-r15|0)+HEAP32[r21>>2]|0;HEAP32[r21>>2]=r22;r21=r9+r1|0;r9=(r2*92&-1)+21856|0;r15=((r21|0)>-1?r21:-r21|0)+HEAP32[r9>>2]|0;HEAP32[r9>>2]=r15;r9=r1-r11|0;r21=(r2*92&-1)+21860|0;r23=((r9|0)>-1?r9:-r9|0)+HEAP32[r21>>2]|0;HEAP32[r21>>2]=r23;r21=r11+r1|0;r11=(r2*92&-1)+21864|0;r9=((r21|0)>-1?r21:-r21|0)+HEAP32[r11>>2]|0;HEAP32[r11>>2]=r9;r11=r1-r8|0;r21=(r2*92&-1)+21868|0;r24=((r11|0)>-1?r11:-r11|0)+HEAP32[r21>>2]|0;HEAP32[r21>>2]=r24;r21=r8+r1|0;r8=(r2*92&-1)+21872|0;r11=((r21|0)>-1?r21:-r21|0)+HEAP32[r8>>2]|0;HEAP32[r8>>2]=r11;r8=r1-r5|0;r5=(r2*92&-1)+21876|0;r21=((r8|0)>-1?r8:-r8|0)+HEAP32[r5>>2]|0;HEAP32[r5>>2]=r21;r5=HEAP32[r6>>2]+r1|0;r6=(r2*92&-1)+21880|0;r8=((r5|0)>-1?r5:-r5|0)+HEAP32[r6>>2]|0;HEAP32[r6>>2]=r8;r6=r1-r17|0;r5=(r2*92&-1)+21884|0;r25=((r6|0)>-1?r6:-r6|0)+HEAP32[r5>>2]|0;HEAP32[r5>>2]=r25;r5=r17+r1|0;r1=(r2*92&-1)+21888|0;r2=((r5|0)>-1?r5:-r5|0)+HEAP32[r1>>2]|0;HEAP32[r1>>2]=r2;r1=r18-HEAP32[r10]<<24>>24;HEAP32[r4>>2]=r1;HEAP32[5136]=r1;HEAP32[r10]=r18;if((HEAP32[r3]&31|0)!=0){r26=r18&255;return r26}r3=r22>>>0<r20>>>0;r10=r3?r22:r20;r20=r15>>>0<r10>>>0;r22=r20?r15:r10;r10=r23>>>0<r22>>>0;r15=r10?r23:r22;r22=r9>>>0<r15>>>0;r23=r22?r9:r15;r15=r24>>>0<r23>>>0;r9=r15?r24:r23;r23=r11>>>0<r9>>>0;r24=r23?r11:r9;r9=r21>>>0<r24>>>0;r11=r9?r21:r24;r24=r8>>>0<r11>>>0;r21=r24?r8:r11;r11=r25>>>0<r21>>>0;r8=r2>>>0<(r11?r25:r21)>>>0?10:r11?9:r24?8:r9?7:r23?6:r15?5:r22?4:r10?3:r20?2:r3&1;_memset(r19,0,44);if((r8|0)==10){r19=HEAP32[r16];if((r19|0)>=16){r26=r18&255;return r26}HEAP32[r16]=r19+1;r26=r18&255;return r26}else if((r8|0)==5){r19=HEAP32[r13];if((r19|0)<=-17){r26=r18&255;return r26}HEAP32[r13]=r19-1;r26=r18&255;return r26}else if((r8|0)==3){r19=HEAP32[r12];if((r19|0)<=-17){r26=r18&255;return r26}HEAP32[r12]=r19-1;r26=r18&255;return r26}else if((r8|0)==4){r19=HEAP32[r12];if((r19|0)>=16){r26=r18&255;return r26}HEAP32[r12]=r19+1;r26=r18&255;return r26}else if((r8|0)==2){r19=HEAP32[r7];if((r19|0)>=16){r26=r18&255;return r26}HEAP32[r7]=r19+1;r26=r18&255;return r26}else if((r8|0)==8){r19=HEAP32[r14];if((r19|0)>=16){r26=r18&255;return r26}HEAP32[r14]=r19+1;r26=r18&255;return r26}else if((r8|0)==9){r19=HEAP32[r16];if((r19|0)<=-17){r26=r18&255;return r26}HEAP32[r16]=r19-1;r26=r18&255;return r26}else if((r8|0)==7){r19=HEAP32[r14];if((r19|0)<=-17){r26=r18&255;return r26}HEAP32[r14]=r19-1;r26=r18&255;return r26}else if((r8|0)==6){r19=HEAP32[r13];if((r19|0)>=16){r26=r18&255;return r26}HEAP32[r13]=r19+1;r26=r18&255;return r26}else if((r8|0)==1){r8=HEAP32[r7];if((r8|0)<=-17){r26=r18&255;return r26}HEAP32[r7]=r8-1;r26=r18&255;return r26}else{r26=r18&255;return r26}}function _EncryptBlock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=r1;r3=HEAP32[2974];r4=r1+4|0;r5=r4;r6=r1+8|0;r7=r6;r8=r1+12|0;r9=r8;r10=HEAP32[2977]^HEAP32[r9>>2];r11=HEAP32[2976]^HEAP32[r7>>2];r12=HEAP32[2975]^HEAP32[r5>>2];r13=r3^HEAP32[r2>>2];r14=0;while(1){r15=HEAP32[((r14&3)<<2)+11896>>2];r16=r15^(r10<<11|r10>>>21)+r11;r17=(HEAPU8[(r16>>>8&255)+5256|0]<<8|HEAPU8[(r16&255)+5256|0]|HEAPU8[(r16>>>16&255)+5256|0]<<16|HEAPU8[(r16>>>24)+5256|0]<<24)^r13;r16=r15+((r11<<17|r11>>>15)^r10)|0;r18=(HEAPU8[(r16>>>8&255)+5256|0]<<8|HEAPU8[(r16&255)+5256|0]|HEAPU8[(r16>>>16&255)+5256|0]<<16|HEAPU8[(r16>>>24)+5256|0]<<24)^r12;r16=r14+1|0;if((r16|0)<32){r12=r10;r10=r18;r13=r11;r11=r17;r14=r16}else{break}}r14=r3^r17;HEAP32[r2>>2]=r14;HEAP32[r5>>2]=HEAP32[2975]^r18;HEAP32[r7>>2]=HEAP32[2976]^r11;HEAP32[r9>>2]=HEAP32[2977]^r10;r10=HEAP32[2975];r9=HEAP32[2976];r11=HEAP32[2977];r7=HEAP32[((r14&255)<<2)+20552>>2]^HEAP32[2974];HEAP32[2974]=r7;r14=HEAP32[(HEAPU8[r1+1|0]<<2)+20552>>2]^r10;HEAP32[2975]=r14;r10=HEAP32[(HEAPU8[r1+2|0]<<2)+20552>>2]^r9;HEAP32[2976]=r10;r9=HEAP32[(HEAPU8[r1+3|0]<<2)+20552>>2]^r11;HEAP32[2977]=r9;r11=HEAP32[(HEAPU8[r4]<<2)+20552>>2]^r7;HEAP32[2974]=r11;r7=HEAP32[(HEAPU8[r1+5|0]<<2)+20552>>2]^r14;HEAP32[2975]=r7;r14=HEAP32[(HEAPU8[r1+6|0]<<2)+20552>>2]^r10;HEAP32[2976]=r14;r10=HEAP32[(HEAPU8[r1+7|0]<<2)+20552>>2]^r9;HEAP32[2977]=r10;r9=HEAP32[(HEAPU8[r6]<<2)+20552>>2]^r11;HEAP32[2974]=r9;r11=HEAP32[(HEAPU8[r1+9|0]<<2)+20552>>2]^r7;HEAP32[2975]=r11;r7=HEAP32[(HEAPU8[r1+10|0]<<2)+20552>>2]^r14;HEAP32[2976]=r7;r14=HEAP32[(HEAPU8[r1+11|0]<<2)+20552>>2]^r10;HEAP32[2977]=r14;HEAP32[2974]=HEAP32[(HEAPU8[r8]<<2)+20552>>2]^r9;HEAP32[2975]=HEAP32[(HEAPU8[r1+13|0]<<2)+20552>>2]^r11;HEAP32[2976]=HEAP32[(HEAPU8[r1+14|0]<<2)+20552>>2]^r7;HEAP32[2977]=HEAP32[(HEAPU8[r1+15|0]<<2)+20552>>2]^r14;return}function _DecryptBlock(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=STACKTOP;STACKTOP=STACKTOP+16|0;r3=r2;r4=r1;r5=HEAP32[2974];r6=r5^HEAP32[r4>>2];r7=r1+4|0;r8=HEAP32[2975]^HEAP32[r7>>2];r9=r1+8|0;r10=HEAP32[2976]^HEAP32[r9>>2];r11=r1+12|0;r12=HEAP32[2977]^HEAP32[r11>>2];r13=r3|0;_memcpy(r13,r1,16)|0;r1=r12;r12=r10;r10=r8;r8=r6;r6=31;while(1){r14=HEAP32[((r6&3)<<2)+11896>>2];r15=r14^(r1<<11|r1>>>21)+r12;r16=(HEAPU8[(r15>>>8&255)+5256|0]<<8|HEAPU8[(r15&255)+5256|0]|HEAPU8[(r15>>>16&255)+5256|0]<<16|HEAPU8[(r15>>>24)+5256|0]<<24)^r8;r15=r14+((r12<<17|r12>>>15)^r1)|0;r17=(HEAPU8[(r15>>>8&255)+5256|0]<<8|HEAPU8[(r15&255)+5256|0]|HEAPU8[(r15>>>16&255)+5256|0]<<16|HEAPU8[(r15>>>24)+5256|0]<<24)^r10;if((r6|0)>0){r10=r1;r1=r17;r8=r12;r12=r16;r6=r6-1|0}else{break}}HEAP32[r4>>2]=r5^r16;HEAP32[r7>>2]=HEAP32[2975]^r17;HEAP32[r9>>2]=HEAP32[2976]^r12;HEAP32[r11>>2]=HEAP32[2977]^r1;r1=HEAP32[(HEAPU8[r3+13|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r3+9|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r3+5|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r3+1|0]<<2)+20552>>2]^HEAP32[2975])));r11=HEAP32[(HEAPU8[r3+14|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r3+10|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r3+6|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r3+2|0]<<2)+20552>>2]^HEAP32[2976])));r12=HEAP32[(HEAPU8[r3+15|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r3+11|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r3+7|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r3+3|0]<<2)+20552>>2]^HEAP32[2977])));HEAP32[2974]=HEAP32[(HEAPU8[r3+12|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r3+8|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r3+4|0]<<2)+20552>>2]^(HEAP32[(HEAPU8[r13]<<2)+20552>>2]^HEAP32[2974])));HEAP32[2975]=r1;HEAP32[2976]=r11;HEAP32[2977]=r12;STACKTOP=r2;return}function _MakeDecodeTables(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=STACKTOP;STACKTOP=STACKTOP+128|0;r4=r3;r5=r3+64;_memset(r4,0,64);r6=(r2|0)>0;if(r6){r7=0;while(1){r8=((HEAP8[r1+r7|0]&15)<<2)+r4|0;HEAP32[r8>>2]=HEAP32[r8>>2]+1;r8=r7+1|0;if((r8|0)<(r2|0)){r7=r8}else{break}}}HEAP32[r4>>2]=0;HEAP32[HEAP32[5041]>>2]=0;HEAP32[HEAP32[5042]>>2]=0;HEAP32[r5>>2]=0;r7=1;r8=0;r9=0;while(1){r10=HEAP32[r4+(r7<<2)>>2];r11=r10+r8<<1;r12=r11<<15-r7;HEAP32[HEAP32[5041]+(r7<<2)>>2]=(r12|0)>65535?65535:r12;r12=HEAP32[5042];r13=r9+HEAP32[r12+(r7-1<<2)>>2]|0;HEAP32[r12+(r7<<2)>>2]=r13;HEAP32[r5+(r7<<2)>>2]=r13;r13=r7+1|0;if((r13|0)<16){r7=r13;r8=r11;r9=r10}else{break}}if(r6){r14=0}else{HEAP32[5040]=r2;STACKTOP=r3;return}while(1){r6=HEAP8[r1+r14|0];if(r6<<24>>24!=0){r9=((r6&15)<<2)+r5|0;r6=HEAP32[r9>>2];HEAP32[r9>>2]=r6+1;HEAP32[HEAP32[5043]+(r6<<2)>>2]=r14}r6=r14+1|0;if((r6|0)<(r2|0)){r14=r6}else{break}}HEAP32[5040]=r2;STACKTOP=r3;return}function _SetOldKeys(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=_strlen(r1);if((r2|0)==0){r3=-1;r4=-1}else{r5=-1;r6=0;while(1){r7=HEAP32[((HEAPU8[r1+r6|0]^r5&255)<<2)+20552>>2]^r5>>>8;r8=r6+1|0;if(r8>>>0<r2>>>0){r5=r7;r6=r8}else{break}}r3=r7>>>16&65535;r4=r7&65535}HEAP16[2904]=r4;HEAP16[2905]=r3;HEAP16[2907]=0;HEAP16[2906]=0;HEAP8[5784]=0;HEAP8[5792]=0;HEAP8[5800]=0;r3=HEAP8[r1];if(r3<<24>>24==0){return}else{r9=r1;r10=r3;r11=0;r12=0;r13=0;r14=0;r15=0}while(1){r3=r10&255;r1=r11+r10&255;HEAP8[5800]=r1;r4=r12^r10;HEAP8[5792]=r4;r7=r13+r10&255;r6=r7<<1|(r7&255)>>>7;HEAP8[5784]=r6;r7=HEAP32[(r3<<2)+20552>>2];r5=(r7^r3^r14&65535)&65535;HEAP16[2906]=r5;r2=(r7>>>16)+r3+(r15&65535)&65535;HEAP16[2907]=r2;r3=r9+1|0;r7=HEAP8[r3];if(r7<<24>>24==0){break}else{r9=r3;r10=r7;r11=r1;r12=r4;r13=r6;r14=r5;r15=r2}}return}function _malloc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98;r2=0;do{if(r1>>>0<245){if(r1>>>0<11){r3=16}else{r3=r1+11&-8}r4=r3>>>3;r5=HEAP32[918];r6=r5>>>(r4>>>0);if((r6&3|0)!=0){r7=(r6&1^1)+r4|0;r8=r7<<1;r9=(r8<<2)+3712|0;r10=(r8+2<<2)+3712|0;r8=HEAP32[r10>>2];r11=r8+8|0;r12=HEAP32[r11>>2];do{if((r9|0)==(r12|0)){HEAP32[918]=r5&~(1<<r7)}else{if(r12>>>0<HEAP32[922]>>>0){_abort()}r13=r12+12|0;if((HEAP32[r13>>2]|0)==(r8|0)){HEAP32[r13>>2]=r9;HEAP32[r10>>2]=r12;break}else{_abort()}}}while(0);r12=r7<<3;HEAP32[r8+4>>2]=r12|3;r10=r8+(r12|4)|0;HEAP32[r10>>2]=HEAP32[r10>>2]|1;r14=r11;return r14}if(r3>>>0<=HEAP32[920]>>>0){r15=r3,r16=r15>>2;break}if((r6|0)!=0){r10=2<<r4;r12=r6<<r4&(r10|-r10);r10=(r12&-r12)-1|0;r12=r10>>>12&16;r9=r10>>>(r12>>>0);r10=r9>>>5&8;r13=r9>>>(r10>>>0);r9=r13>>>2&4;r17=r13>>>(r9>>>0);r13=r17>>>1&2;r18=r17>>>(r13>>>0);r17=r18>>>1&1;r19=(r10|r12|r9|r13|r17)+(r18>>>(r17>>>0))|0;r17=r19<<1;r18=(r17<<2)+3712|0;r13=(r17+2<<2)+3712|0;r17=HEAP32[r13>>2];r9=r17+8|0;r12=HEAP32[r9>>2];do{if((r18|0)==(r12|0)){HEAP32[918]=r5&~(1<<r19)}else{if(r12>>>0<HEAP32[922]>>>0){_abort()}r10=r12+12|0;if((HEAP32[r10>>2]|0)==(r17|0)){HEAP32[r10>>2]=r18;HEAP32[r13>>2]=r12;break}else{_abort()}}}while(0);r12=r19<<3;r13=r12-r3|0;HEAP32[r17+4>>2]=r3|3;r18=r17;r5=r18+r3|0;HEAP32[r18+(r3|4)>>2]=r13|1;HEAP32[r18+r12>>2]=r13;r12=HEAP32[920];if((r12|0)!=0){r18=HEAP32[923];r4=r12>>>3;r12=r4<<1;r6=(r12<<2)+3712|0;r11=HEAP32[918];r8=1<<r4;do{if((r11&r8|0)==0){HEAP32[918]=r11|r8;r20=r6;r21=(r12+2<<2)+3712|0}else{r4=(r12+2<<2)+3712|0;r7=HEAP32[r4>>2];if(r7>>>0>=HEAP32[922]>>>0){r20=r7;r21=r4;break}_abort()}}while(0);HEAP32[r21>>2]=r18;HEAP32[r20+12>>2]=r18;HEAP32[r18+8>>2]=r20;HEAP32[r18+12>>2]=r6}HEAP32[920]=r13;HEAP32[923]=r5;r14=r9;return r14}r12=HEAP32[919];if((r12|0)==0){r15=r3,r16=r15>>2;break}r8=(r12&-r12)-1|0;r12=r8>>>12&16;r11=r8>>>(r12>>>0);r8=r11>>>5&8;r17=r11>>>(r8>>>0);r11=r17>>>2&4;r19=r17>>>(r11>>>0);r17=r19>>>1&2;r4=r19>>>(r17>>>0);r19=r4>>>1&1;r7=HEAP32[((r8|r12|r11|r17|r19)+(r4>>>(r19>>>0))<<2)+3976>>2];r19=r7;r4=r7,r17=r4>>2;r11=(HEAP32[r7+4>>2]&-8)-r3|0;while(1){r7=HEAP32[r19+16>>2];if((r7|0)==0){r12=HEAP32[r19+20>>2];if((r12|0)==0){break}else{r22=r12}}else{r22=r7}r7=(HEAP32[r22+4>>2]&-8)-r3|0;r12=r7>>>0<r11>>>0;r19=r22;r4=r12?r22:r4,r17=r4>>2;r11=r12?r7:r11}r19=r4;r9=HEAP32[922];if(r19>>>0<r9>>>0){_abort()}r5=r19+r3|0;r13=r5;if(r19>>>0>=r5>>>0){_abort()}r5=HEAP32[r17+6];r6=HEAP32[r17+3];do{if((r6|0)==(r4|0)){r18=r4+20|0;r7=HEAP32[r18>>2];if((r7|0)==0){r12=r4+16|0;r8=HEAP32[r12>>2];if((r8|0)==0){r23=0,r24=r23>>2;break}else{r25=r8;r26=r12}}else{r25=r7;r26=r18}while(1){r18=r25+20|0;r7=HEAP32[r18>>2];if((r7|0)!=0){r25=r7;r26=r18;continue}r18=r25+16|0;r7=HEAP32[r18>>2];if((r7|0)==0){break}else{r25=r7;r26=r18}}if(r26>>>0<r9>>>0){_abort()}else{HEAP32[r26>>2]=0;r23=r25,r24=r23>>2;break}}else{r18=HEAP32[r17+2];if(r18>>>0<r9>>>0){_abort()}r7=r18+12|0;if((HEAP32[r7>>2]|0)!=(r4|0)){_abort()}r12=r6+8|0;if((HEAP32[r12>>2]|0)==(r4|0)){HEAP32[r7>>2]=r6;HEAP32[r12>>2]=r18;r23=r6,r24=r23>>2;break}else{_abort()}}}while(0);L2802:do{if((r5|0)!=0){r6=r4+28|0;r9=(HEAP32[r6>>2]<<2)+3976|0;do{if((r4|0)==(HEAP32[r9>>2]|0)){HEAP32[r9>>2]=r23;if((r23|0)!=0){break}HEAP32[919]=HEAP32[919]&~(1<<HEAP32[r6>>2]);break L2802}else{if(r5>>>0<HEAP32[922]>>>0){_abort()}r18=r5+16|0;if((HEAP32[r18>>2]|0)==(r4|0)){HEAP32[r18>>2]=r23}else{HEAP32[r5+20>>2]=r23}if((r23|0)==0){break L2802}}}while(0);if(r23>>>0<HEAP32[922]>>>0){_abort()}HEAP32[r24+6]=r5;r6=HEAP32[r17+4];do{if((r6|0)!=0){if(r6>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r24+4]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);r6=HEAP32[r17+5];if((r6|0)==0){break}if(r6>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r24+5]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);if(r11>>>0<16){r5=r11+r3|0;HEAP32[r17+1]=r5|3;r6=r5+(r19+4)|0;HEAP32[r6>>2]=HEAP32[r6>>2]|1}else{HEAP32[r17+1]=r3|3;HEAP32[r19+(r3|4)>>2]=r11|1;HEAP32[r19+r11+r3>>2]=r11;r6=HEAP32[920];if((r6|0)!=0){r5=HEAP32[923];r9=r6>>>3;r6=r9<<1;r18=(r6<<2)+3712|0;r12=HEAP32[918];r7=1<<r9;do{if((r12&r7|0)==0){HEAP32[918]=r12|r7;r27=r18;r28=(r6+2<<2)+3712|0}else{r9=(r6+2<<2)+3712|0;r8=HEAP32[r9>>2];if(r8>>>0>=HEAP32[922]>>>0){r27=r8;r28=r9;break}_abort()}}while(0);HEAP32[r28>>2]=r5;HEAP32[r27+12>>2]=r5;HEAP32[r5+8>>2]=r27;HEAP32[r5+12>>2]=r18}HEAP32[920]=r11;HEAP32[923]=r13}r14=r4+8|0;return r14}else{if(r1>>>0>4294967231){r15=-1,r16=r15>>2;break}r6=r1+11|0;r7=r6&-8,r12=r7>>2;r19=HEAP32[919];if((r19|0)==0){r15=r7,r16=r15>>2;break}r17=-r7|0;r9=r6>>>8;do{if((r9|0)==0){r29=0}else{if(r7>>>0>16777215){r29=31;break}r6=(r9+1048320|0)>>>16&8;r8=r9<<r6;r10=(r8+520192|0)>>>16&4;r30=r8<<r10;r8=(r30+245760|0)>>>16&2;r31=14-(r10|r6|r8)+(r30<<r8>>>15)|0;r29=r7>>>((r31+7|0)>>>0)&1|r31<<1}}while(0);r9=HEAP32[(r29<<2)+3976>>2];L2850:do{if((r9|0)==0){r32=0;r33=r17;r34=0}else{if((r29|0)==31){r35=0}else{r35=25-(r29>>>1)|0}r4=0;r13=r17;r11=r9,r18=r11>>2;r5=r7<<r35;r31=0;while(1){r8=HEAP32[r18+1]&-8;r30=r8-r7|0;if(r30>>>0<r13>>>0){if((r8|0)==(r7|0)){r32=r11;r33=r30;r34=r11;break L2850}else{r36=r11;r37=r30}}else{r36=r4;r37=r13}r30=HEAP32[r18+5];r8=HEAP32[((r5>>>31<<2)+16>>2)+r18];r6=(r30|0)==0|(r30|0)==(r8|0)?r31:r30;if((r8|0)==0){r32=r36;r33=r37;r34=r6;break}else{r4=r36;r13=r37;r11=r8,r18=r11>>2;r5=r5<<1;r31=r6}}}}while(0);if((r34|0)==0&(r32|0)==0){r9=2<<r29;r17=r19&(r9|-r9);if((r17|0)==0){r15=r7,r16=r15>>2;break}r9=(r17&-r17)-1|0;r17=r9>>>12&16;r31=r9>>>(r17>>>0);r9=r31>>>5&8;r5=r31>>>(r9>>>0);r31=r5>>>2&4;r11=r5>>>(r31>>>0);r5=r11>>>1&2;r18=r11>>>(r5>>>0);r11=r18>>>1&1;r38=HEAP32[((r9|r17|r31|r5|r11)+(r18>>>(r11>>>0))<<2)+3976>>2]}else{r38=r34}if((r38|0)==0){r39=r33;r40=r32,r41=r40>>2}else{r11=r38,r18=r11>>2;r5=r33;r31=r32;while(1){r17=(HEAP32[r18+1]&-8)-r7|0;r9=r17>>>0<r5>>>0;r13=r9?r17:r5;r17=r9?r11:r31;r9=HEAP32[r18+4];if((r9|0)!=0){r11=r9,r18=r11>>2;r5=r13;r31=r17;continue}r9=HEAP32[r18+5];if((r9|0)==0){r39=r13;r40=r17,r41=r40>>2;break}else{r11=r9,r18=r11>>2;r5=r13;r31=r17}}}if((r40|0)==0){r15=r7,r16=r15>>2;break}if(r39>>>0>=(HEAP32[920]-r7|0)>>>0){r15=r7,r16=r15>>2;break}r31=r40,r5=r31>>2;r11=HEAP32[922];if(r31>>>0<r11>>>0){_abort()}r18=r31+r7|0;r19=r18;if(r31>>>0>=r18>>>0){_abort()}r17=HEAP32[r41+6];r13=HEAP32[r41+3];do{if((r13|0)==(r40|0)){r9=r40+20|0;r4=HEAP32[r9>>2];if((r4|0)==0){r6=r40+16|0;r8=HEAP32[r6>>2];if((r8|0)==0){r42=0,r43=r42>>2;break}else{r44=r8;r45=r6}}else{r44=r4;r45=r9}while(1){r9=r44+20|0;r4=HEAP32[r9>>2];if((r4|0)!=0){r44=r4;r45=r9;continue}r9=r44+16|0;r4=HEAP32[r9>>2];if((r4|0)==0){break}else{r44=r4;r45=r9}}if(r45>>>0<r11>>>0){_abort()}else{HEAP32[r45>>2]=0;r42=r44,r43=r42>>2;break}}else{r9=HEAP32[r41+2];if(r9>>>0<r11>>>0){_abort()}r4=r9+12|0;if((HEAP32[r4>>2]|0)!=(r40|0)){_abort()}r6=r13+8|0;if((HEAP32[r6>>2]|0)==(r40|0)){HEAP32[r4>>2]=r13;HEAP32[r6>>2]=r9;r42=r13,r43=r42>>2;break}else{_abort()}}}while(0);L2900:do{if((r17|0)!=0){r13=r40+28|0;r11=(HEAP32[r13>>2]<<2)+3976|0;do{if((r40|0)==(HEAP32[r11>>2]|0)){HEAP32[r11>>2]=r42;if((r42|0)!=0){break}HEAP32[919]=HEAP32[919]&~(1<<HEAP32[r13>>2]);break L2900}else{if(r17>>>0<HEAP32[922]>>>0){_abort()}r9=r17+16|0;if((HEAP32[r9>>2]|0)==(r40|0)){HEAP32[r9>>2]=r42}else{HEAP32[r17+20>>2]=r42}if((r42|0)==0){break L2900}}}while(0);if(r42>>>0<HEAP32[922]>>>0){_abort()}HEAP32[r43+6]=r17;r13=HEAP32[r41+4];do{if((r13|0)!=0){if(r13>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r43+4]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);r13=HEAP32[r41+5];if((r13|0)==0){break}if(r13>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r43+5]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);L2928:do{if(r39>>>0<16){r17=r39+r7|0;HEAP32[r41+1]=r17|3;r13=r17+(r31+4)|0;HEAP32[r13>>2]=HEAP32[r13>>2]|1}else{HEAP32[r41+1]=r7|3;HEAP32[((r7|4)>>2)+r5]=r39|1;HEAP32[(r39>>2)+r5+r12]=r39;r13=r39>>>3;if(r39>>>0<256){r17=r13<<1;r11=(r17<<2)+3712|0;r9=HEAP32[918];r6=1<<r13;do{if((r9&r6|0)==0){HEAP32[918]=r9|r6;r46=r11;r47=(r17+2<<2)+3712|0}else{r13=(r17+2<<2)+3712|0;r4=HEAP32[r13>>2];if(r4>>>0>=HEAP32[922]>>>0){r46=r4;r47=r13;break}_abort()}}while(0);HEAP32[r47>>2]=r19;HEAP32[r46+12>>2]=r19;HEAP32[r12+(r5+2)]=r46;HEAP32[r12+(r5+3)]=r11;break}r17=r18;r6=r39>>>8;do{if((r6|0)==0){r48=0}else{if(r39>>>0>16777215){r48=31;break}r9=(r6+1048320|0)>>>16&8;r13=r6<<r9;r4=(r13+520192|0)>>>16&4;r8=r13<<r4;r13=(r8+245760|0)>>>16&2;r30=14-(r4|r9|r13)+(r8<<r13>>>15)|0;r48=r39>>>((r30+7|0)>>>0)&1|r30<<1}}while(0);r6=(r48<<2)+3976|0;HEAP32[r12+(r5+7)]=r48;HEAP32[r12+(r5+5)]=0;HEAP32[r12+(r5+4)]=0;r11=HEAP32[919];r30=1<<r48;if((r11&r30|0)==0){HEAP32[919]=r11|r30;HEAP32[r6>>2]=r17;HEAP32[r12+(r5+6)]=r6;HEAP32[r12+(r5+3)]=r17;HEAP32[r12+(r5+2)]=r17;break}r30=HEAP32[r6>>2];if((r48|0)==31){r49=0}else{r49=25-(r48>>>1)|0}L2949:do{if((HEAP32[r30+4>>2]&-8|0)==(r39|0)){r50=r30}else{r6=r30;r11=r39<<r49;while(1){r51=(r11>>>31<<2)+r6+16|0;r13=HEAP32[r51>>2];if((r13|0)==0){break}if((HEAP32[r13+4>>2]&-8|0)==(r39|0)){r50=r13;break L2949}else{r6=r13;r11=r11<<1}}if(r51>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r51>>2]=r17;HEAP32[r12+(r5+6)]=r6;HEAP32[r12+(r5+3)]=r17;HEAP32[r12+(r5+2)]=r17;break L2928}}}while(0);r30=r50+8|0;r11=HEAP32[r30>>2];r13=HEAP32[922];if(r50>>>0<r13>>>0){_abort()}if(r11>>>0<r13>>>0){_abort()}else{HEAP32[r11+12>>2]=r17;HEAP32[r30>>2]=r17;HEAP32[r12+(r5+2)]=r11;HEAP32[r12+(r5+3)]=r50;HEAP32[r12+(r5+6)]=0;break}}}while(0);r14=r40+8|0;return r14}}while(0);r40=HEAP32[920];if(r15>>>0<=r40>>>0){r50=r40-r15|0;r51=HEAP32[923];if(r50>>>0>15){r39=r51;HEAP32[923]=r39+r15;HEAP32[920]=r50;HEAP32[(r39+4>>2)+r16]=r50|1;HEAP32[r39+r40>>2]=r50;HEAP32[r51+4>>2]=r15|3}else{HEAP32[920]=0;HEAP32[923]=0;HEAP32[r51+4>>2]=r40|3;r50=r40+(r51+4)|0;HEAP32[r50>>2]=HEAP32[r50>>2]|1}r14=r51+8|0;return r14}r51=HEAP32[921];if(r15>>>0<r51>>>0){r50=r51-r15|0;HEAP32[921]=r50;r51=HEAP32[924];r40=r51;HEAP32[924]=r40+r15;HEAP32[(r40+4>>2)+r16]=r50|1;HEAP32[r51+4>>2]=r15|3;r14=r51+8|0;return r14}do{if((HEAP32[646]|0)==0){r51=_sysconf(8);if((r51-1&r51|0)==0){HEAP32[648]=r51;HEAP32[647]=r51;HEAP32[649]=-1;HEAP32[650]=2097152;HEAP32[651]=0;HEAP32[1029]=0;HEAP32[646]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);r51=r15+48|0;r50=HEAP32[648];r40=r15+47|0;r39=r50+r40|0;r49=-r50|0;r50=r39&r49;if(r50>>>0<=r15>>>0){r14=0;return r14}r48=HEAP32[1028];do{if((r48|0)!=0){r46=HEAP32[1026];r47=r46+r50|0;if(r47>>>0<=r46>>>0|r47>>>0>r48>>>0){r14=0}else{break}return r14}}while(0);L2993:do{if((HEAP32[1029]&4|0)==0){r48=HEAP32[924];L2995:do{if((r48|0)==0){r2=2177}else{r47=r48;r46=4120;while(1){r52=r46|0;r41=HEAP32[r52>>2];if(r41>>>0<=r47>>>0){r53=r46+4|0;if((r41+HEAP32[r53>>2]|0)>>>0>r47>>>0){break}}r41=HEAP32[r46+8>>2];if((r41|0)==0){r2=2177;break L2995}else{r46=r41}}if((r46|0)==0){r2=2177;break}r47=r39-HEAP32[921]&r49;if(r47>>>0>=2147483647){r54=0;break}r17=_sbrk(r47);r41=(r17|0)==(HEAP32[r52>>2]+HEAP32[r53>>2]|0);r55=r41?r17:-1;r56=r41?r47:0;r57=r17;r58=r47;r2=2186}}while(0);do{if(r2==2177){r48=_sbrk(0);if((r48|0)==-1){r54=0;break}r47=r48;r17=HEAP32[647];r41=r17-1|0;if((r41&r47|0)==0){r59=r50}else{r59=r50-r47+(r41+r47&-r17)|0}r17=HEAP32[1026];r47=r17+r59|0;if(!(r59>>>0>r15>>>0&r59>>>0<2147483647)){r54=0;break}r41=HEAP32[1028];if((r41|0)!=0){if(r47>>>0<=r17>>>0|r47>>>0>r41>>>0){r54=0;break}}r41=_sbrk(r59);r47=(r41|0)==(r48|0);r55=r47?r48:-1;r56=r47?r59:0;r57=r41;r58=r59;r2=2186}}while(0);L3015:do{if(r2==2186){r41=-r58|0;if((r55|0)!=-1){r60=r56,r61=r60>>2;r62=r55,r63=r62>>2;r2=2197;break L2993}do{if((r57|0)!=-1&r58>>>0<2147483647&r58>>>0<r51>>>0){r47=HEAP32[648];r48=r40-r58+r47&-r47;if(r48>>>0>=2147483647){r64=r58;break}if((_sbrk(r48)|0)==-1){_sbrk(r41);r54=r56;break L3015}else{r64=r48+r58|0;break}}else{r64=r58}}while(0);if((r57|0)==-1){r54=r56}else{r60=r64,r61=r60>>2;r62=r57,r63=r62>>2;r2=2197;break L2993}}}while(0);HEAP32[1029]=HEAP32[1029]|4;r65=r54;r2=2194}else{r65=0;r2=2194}}while(0);do{if(r2==2194){if(r50>>>0>=2147483647){break}r54=_sbrk(r50);r57=_sbrk(0);if(!((r57|0)!=-1&(r54|0)!=-1&r54>>>0<r57>>>0)){break}r64=r57-r54|0;r57=r64>>>0>(r15+40|0)>>>0;if(r57){r60=r57?r64:r65,r61=r60>>2;r62=r54,r63=r62>>2;r2=2197}}}while(0);do{if(r2==2197){r65=HEAP32[1026]+r60|0;HEAP32[1026]=r65;if(r65>>>0>HEAP32[1027]>>>0){HEAP32[1027]=r65}r65=HEAP32[924],r50=r65>>2;L3035:do{if((r65|0)==0){r54=HEAP32[922];if((r54|0)==0|r62>>>0<r54>>>0){HEAP32[922]=r62}HEAP32[1030]=r62;HEAP32[1031]=r60;HEAP32[1033]=0;HEAP32[927]=HEAP32[646];HEAP32[926]=-1;r54=0;while(1){r64=r54<<1;r57=(r64<<2)+3712|0;HEAP32[(r64+3<<2)+3712>>2]=r57;HEAP32[(r64+2<<2)+3712>>2]=r57;r57=r54+1|0;if(r57>>>0<32){r54=r57}else{break}}r54=r62+8|0;if((r54&7|0)==0){r66=0}else{r66=-r54&7}r54=r60-40-r66|0;HEAP32[924]=r62+r66;HEAP32[921]=r54;HEAP32[(r66+4>>2)+r63]=r54|1;HEAP32[(r60-36>>2)+r63]=40;HEAP32[925]=HEAP32[650]}else{r54=4120,r57=r54>>2;while(1){r67=HEAP32[r57];r68=r54+4|0;r69=HEAP32[r68>>2];if((r62|0)==(r67+r69|0)){r2=2209;break}r64=HEAP32[r57+2];if((r64|0)==0){break}else{r54=r64,r57=r54>>2}}do{if(r2==2209){if((HEAP32[r57+3]&8|0)!=0){break}r54=r65;if(!(r54>>>0>=r67>>>0&r54>>>0<r62>>>0)){break}HEAP32[r68>>2]=r69+r60;r54=HEAP32[924];r64=HEAP32[921]+r60|0;r56=r54;r58=r54+8|0;if((r58&7|0)==0){r70=0}else{r70=-r58&7}r58=r64-r70|0;HEAP32[924]=r56+r70;HEAP32[921]=r58;HEAP32[r70+(r56+4)>>2]=r58|1;HEAP32[r64+(r56+4)>>2]=40;HEAP32[925]=HEAP32[650];break L3035}}while(0);if(r62>>>0<HEAP32[922]>>>0){HEAP32[922]=r62}r57=r62+r60|0;r56=4120;while(1){r71=r56|0;if((HEAP32[r71>>2]|0)==(r57|0)){r2=2219;break}r64=HEAP32[r56+8>>2];if((r64|0)==0){break}else{r56=r64}}do{if(r2==2219){if((HEAP32[r56+12>>2]&8|0)!=0){break}HEAP32[r71>>2]=r62;r57=r56+4|0;HEAP32[r57>>2]=HEAP32[r57>>2]+r60;r57=r62+8|0;if((r57&7|0)==0){r72=0}else{r72=-r57&7}r57=r60+(r62+8)|0;if((r57&7|0)==0){r73=0,r74=r73>>2}else{r73=-r57&7,r74=r73>>2}r57=r62+r73+r60|0;r64=r57;r58=r72+r15|0,r54=r58>>2;r40=r62+r58|0;r58=r40;r51=r57-(r62+r72)-r15|0;HEAP32[(r72+4>>2)+r63]=r15|3;L3072:do{if((r64|0)==(HEAP32[924]|0)){r55=HEAP32[921]+r51|0;HEAP32[921]=r55;HEAP32[924]=r58;HEAP32[r54+(r63+1)]=r55|1}else{if((r64|0)==(HEAP32[923]|0)){r55=HEAP32[920]+r51|0;HEAP32[920]=r55;HEAP32[923]=r58;HEAP32[r54+(r63+1)]=r55|1;HEAP32[(r55>>2)+r63+r54]=r55;break}r55=r60+4|0;r59=HEAP32[(r55>>2)+r63+r74];if((r59&3|0)==1){r53=r59&-8;r52=r59>>>3;L3080:do{if(r59>>>0<256){r49=HEAP32[((r73|8)>>2)+r63+r61];r39=HEAP32[r74+(r63+(r61+3))];r41=(r52<<3)+3712|0;do{if((r49|0)!=(r41|0)){if(r49>>>0<HEAP32[922]>>>0){_abort()}if((HEAP32[r49+12>>2]|0)==(r64|0)){break}_abort()}}while(0);if((r39|0)==(r49|0)){HEAP32[918]=HEAP32[918]&~(1<<r52);break}do{if((r39|0)==(r41|0)){r75=r39+8|0}else{if(r39>>>0<HEAP32[922]>>>0){_abort()}r46=r39+8|0;if((HEAP32[r46>>2]|0)==(r64|0)){r75=r46;break}_abort()}}while(0);HEAP32[r49+12>>2]=r39;HEAP32[r75>>2]=r49}else{r41=r57;r46=HEAP32[((r73|24)>>2)+r63+r61];r48=HEAP32[r74+(r63+(r61+3))];do{if((r48|0)==(r41|0)){r47=r73|16;r17=r62+r55+r47|0;r42=HEAP32[r17>>2];if((r42|0)==0){r43=r62+r47+r60|0;r47=HEAP32[r43>>2];if((r47|0)==0){r76=0,r77=r76>>2;break}else{r78=r47;r79=r43}}else{r78=r42;r79=r17}while(1){r17=r78+20|0;r42=HEAP32[r17>>2];if((r42|0)!=0){r78=r42;r79=r17;continue}r17=r78+16|0;r42=HEAP32[r17>>2];if((r42|0)==0){break}else{r78=r42;r79=r17}}if(r79>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r79>>2]=0;r76=r78,r77=r76>>2;break}}else{r17=HEAP32[((r73|8)>>2)+r63+r61];if(r17>>>0<HEAP32[922]>>>0){_abort()}r42=r17+12|0;if((HEAP32[r42>>2]|0)!=(r41|0)){_abort()}r43=r48+8|0;if((HEAP32[r43>>2]|0)==(r41|0)){HEAP32[r42>>2]=r48;HEAP32[r43>>2]=r17;r76=r48,r77=r76>>2;break}else{_abort()}}}while(0);if((r46|0)==0){break}r48=r73+(r62+(r60+28))|0;r49=(HEAP32[r48>>2]<<2)+3976|0;do{if((r41|0)==(HEAP32[r49>>2]|0)){HEAP32[r49>>2]=r76;if((r76|0)!=0){break}HEAP32[919]=HEAP32[919]&~(1<<HEAP32[r48>>2]);break L3080}else{if(r46>>>0<HEAP32[922]>>>0){_abort()}r39=r46+16|0;if((HEAP32[r39>>2]|0)==(r41|0)){HEAP32[r39>>2]=r76}else{HEAP32[r46+20>>2]=r76}if((r76|0)==0){break L3080}}}while(0);if(r76>>>0<HEAP32[922]>>>0){_abort()}HEAP32[r77+6]=r46;r41=r73|16;r48=HEAP32[(r41>>2)+r63+r61];do{if((r48|0)!=0){if(r48>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r77+4]=r48;HEAP32[r48+24>>2]=r76;break}}}while(0);r48=HEAP32[(r55+r41>>2)+r63];if((r48|0)==0){break}if(r48>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r77+5]=r48;HEAP32[r48+24>>2]=r76;break}}}while(0);r80=r62+(r53|r73)+r60|0;r81=r53+r51|0}else{r80=r64;r81=r51}r55=r80+4|0;HEAP32[r55>>2]=HEAP32[r55>>2]&-2;HEAP32[r54+(r63+1)]=r81|1;HEAP32[(r81>>2)+r63+r54]=r81;r55=r81>>>3;if(r81>>>0<256){r52=r55<<1;r59=(r52<<2)+3712|0;r48=HEAP32[918];r46=1<<r55;do{if((r48&r46|0)==0){HEAP32[918]=r48|r46;r82=r59;r83=(r52+2<<2)+3712|0}else{r55=(r52+2<<2)+3712|0;r49=HEAP32[r55>>2];if(r49>>>0>=HEAP32[922]>>>0){r82=r49;r83=r55;break}_abort()}}while(0);HEAP32[r83>>2]=r58;HEAP32[r82+12>>2]=r58;HEAP32[r54+(r63+2)]=r82;HEAP32[r54+(r63+3)]=r59;break}r52=r40;r46=r81>>>8;do{if((r46|0)==0){r84=0}else{if(r81>>>0>16777215){r84=31;break}r48=(r46+1048320|0)>>>16&8;r53=r46<<r48;r55=(r53+520192|0)>>>16&4;r49=r53<<r55;r53=(r49+245760|0)>>>16&2;r39=14-(r55|r48|r53)+(r49<<r53>>>15)|0;r84=r81>>>((r39+7|0)>>>0)&1|r39<<1}}while(0);r46=(r84<<2)+3976|0;HEAP32[r54+(r63+7)]=r84;HEAP32[r54+(r63+5)]=0;HEAP32[r54+(r63+4)]=0;r59=HEAP32[919];r39=1<<r84;if((r59&r39|0)==0){HEAP32[919]=r59|r39;HEAP32[r46>>2]=r52;HEAP32[r54+(r63+6)]=r46;HEAP32[r54+(r63+3)]=r52;HEAP32[r54+(r63+2)]=r52;break}r39=HEAP32[r46>>2];if((r84|0)==31){r85=0}else{r85=25-(r84>>>1)|0}L3169:do{if((HEAP32[r39+4>>2]&-8|0)==(r81|0)){r86=r39}else{r46=r39;r59=r81<<r85;while(1){r87=(r59>>>31<<2)+r46+16|0;r53=HEAP32[r87>>2];if((r53|0)==0){break}if((HEAP32[r53+4>>2]&-8|0)==(r81|0)){r86=r53;break L3169}else{r46=r53;r59=r59<<1}}if(r87>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r87>>2]=r52;HEAP32[r54+(r63+6)]=r46;HEAP32[r54+(r63+3)]=r52;HEAP32[r54+(r63+2)]=r52;break L3072}}}while(0);r39=r86+8|0;r59=HEAP32[r39>>2];r41=HEAP32[922];if(r86>>>0<r41>>>0){_abort()}if(r59>>>0<r41>>>0){_abort()}else{HEAP32[r59+12>>2]=r52;HEAP32[r39>>2]=r52;HEAP32[r54+(r63+2)]=r59;HEAP32[r54+(r63+3)]=r86;HEAP32[r54+(r63+6)]=0;break}}}while(0);r14=r62+(r72|8)|0;return r14}}while(0);r56=r65;r54=4120,r40=r54>>2;while(1){r88=HEAP32[r40];if(r88>>>0<=r56>>>0){r89=HEAP32[r40+1];r90=r88+r89|0;if(r90>>>0>r56>>>0){break}}r54=HEAP32[r40+2],r40=r54>>2}r54=r88+(r89-39)|0;if((r54&7|0)==0){r91=0}else{r91=-r54&7}r54=r88+(r89-47)+r91|0;r40=r54>>>0<(r65+16|0)>>>0?r56:r54;r54=r40+8|0,r58=r54>>2;r51=r62+8|0;if((r51&7|0)==0){r92=0}else{r92=-r51&7}r51=r60-40-r92|0;HEAP32[924]=r62+r92;HEAP32[921]=r51;HEAP32[(r92+4>>2)+r63]=r51|1;HEAP32[(r60-36>>2)+r63]=40;HEAP32[925]=HEAP32[650];HEAP32[r40+4>>2]=27;HEAP32[r58]=HEAP32[1030];HEAP32[r58+1]=HEAP32[1031];HEAP32[r58+2]=HEAP32[1032];HEAP32[r58+3]=HEAP32[1033];HEAP32[1030]=r62;HEAP32[1031]=r60;HEAP32[1033]=0;HEAP32[1032]=r54;r54=r40+28|0;HEAP32[r54>>2]=7;if((r40+32|0)>>>0<r90>>>0){r58=r54;while(1){r54=r58+4|0;HEAP32[r54>>2]=7;if((r58+8|0)>>>0<r90>>>0){r58=r54}else{break}}}if((r40|0)==(r56|0)){break}r58=r40-r65|0;r54=r58+(r56+4)|0;HEAP32[r54>>2]=HEAP32[r54>>2]&-2;HEAP32[r50+1]=r58|1;HEAP32[r56+r58>>2]=r58;r54=r58>>>3;if(r58>>>0<256){r51=r54<<1;r64=(r51<<2)+3712|0;r57=HEAP32[918];r6=1<<r54;do{if((r57&r6|0)==0){HEAP32[918]=r57|r6;r93=r64;r94=(r51+2<<2)+3712|0}else{r54=(r51+2<<2)+3712|0;r59=HEAP32[r54>>2];if(r59>>>0>=HEAP32[922]>>>0){r93=r59;r94=r54;break}_abort()}}while(0);HEAP32[r94>>2]=r65;HEAP32[r93+12>>2]=r65;HEAP32[r50+2]=r93;HEAP32[r50+3]=r64;break}r51=r65;r6=r58>>>8;do{if((r6|0)==0){r95=0}else{if(r58>>>0>16777215){r95=31;break}r57=(r6+1048320|0)>>>16&8;r56=r6<<r57;r40=(r56+520192|0)>>>16&4;r54=r56<<r40;r56=(r54+245760|0)>>>16&2;r59=14-(r40|r57|r56)+(r54<<r56>>>15)|0;r95=r58>>>((r59+7|0)>>>0)&1|r59<<1}}while(0);r6=(r95<<2)+3976|0;HEAP32[r50+7]=r95;HEAP32[r50+5]=0;HEAP32[r50+4]=0;r64=HEAP32[919];r59=1<<r95;if((r64&r59|0)==0){HEAP32[919]=r64|r59;HEAP32[r6>>2]=r51;HEAP32[r50+6]=r6;HEAP32[r50+3]=r65;HEAP32[r50+2]=r65;break}r59=HEAP32[r6>>2];if((r95|0)==31){r96=0}else{r96=25-(r95>>>1)|0}L3223:do{if((HEAP32[r59+4>>2]&-8|0)==(r58|0)){r97=r59}else{r6=r59;r64=r58<<r96;while(1){r98=(r64>>>31<<2)+r6+16|0;r56=HEAP32[r98>>2];if((r56|0)==0){break}if((HEAP32[r56+4>>2]&-8|0)==(r58|0)){r97=r56;break L3223}else{r6=r56;r64=r64<<1}}if(r98>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r98>>2]=r51;HEAP32[r50+6]=r6;HEAP32[r50+3]=r65;HEAP32[r50+2]=r65;break L3035}}}while(0);r58=r97+8|0;r59=HEAP32[r58>>2];r64=HEAP32[922];if(r97>>>0<r64>>>0){_abort()}if(r59>>>0<r64>>>0){_abort()}else{HEAP32[r59+12>>2]=r51;HEAP32[r58>>2]=r51;HEAP32[r50+2]=r59;HEAP32[r50+3]=r97;HEAP32[r50+6]=0;break}}}while(0);r50=HEAP32[921];if(r50>>>0<=r15>>>0){break}r65=r50-r15|0;HEAP32[921]=r65;r50=HEAP32[924];r59=r50;HEAP32[924]=r59+r15;HEAP32[(r59+4>>2)+r16]=r65|1;HEAP32[r50+4>>2]=r15|3;r14=r50+8|0;return r14}}while(0);HEAP32[___errno_location()>>2]=12;r14=0;return r14}function _free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46;r2=r1>>2;if((r1|0)==0){return}r3=r1-8|0;r4=r3;r5=HEAP32[922];if(r3>>>0<r5>>>0){_abort()}r6=HEAP32[r1-4>>2];r7=r6&3;if((r7|0)==1){_abort()}r8=r6&-8,r9=r8>>2;r10=r1+(r8-8)|0;r11=r10;L3254:do{if((r6&1|0)==0){r12=HEAP32[r3>>2];if((r7|0)==0){return}r13=-8-r12|0,r14=r13>>2;r15=r1+r13|0;r16=r15;r17=r12+r8|0;if(r15>>>0<r5>>>0){_abort()}if((r16|0)==(HEAP32[923]|0)){r18=(r1+(r8-4)|0)>>2;if((HEAP32[r18]&3|0)!=3){r19=r16,r20=r19>>2;r21=r17;break}HEAP32[920]=r17;HEAP32[r18]=HEAP32[r18]&-2;HEAP32[r14+(r2+1)]=r17|1;HEAP32[r10>>2]=r17;return}r18=r12>>>3;if(r12>>>0<256){r12=HEAP32[r14+(r2+2)];r22=HEAP32[r14+(r2+3)];r23=(r18<<3)+3712|0;do{if((r12|0)!=(r23|0)){if(r12>>>0<r5>>>0){_abort()}if((HEAP32[r12+12>>2]|0)==(r16|0)){break}_abort()}}while(0);if((r22|0)==(r12|0)){HEAP32[918]=HEAP32[918]&~(1<<r18);r19=r16,r20=r19>>2;r21=r17;break}do{if((r22|0)==(r23|0)){r24=r22+8|0}else{if(r22>>>0<r5>>>0){_abort()}r25=r22+8|0;if((HEAP32[r25>>2]|0)==(r16|0)){r24=r25;break}_abort()}}while(0);HEAP32[r12+12>>2]=r22;HEAP32[r24>>2]=r12;r19=r16,r20=r19>>2;r21=r17;break}r23=r15;r18=HEAP32[r14+(r2+6)];r25=HEAP32[r14+(r2+3)];do{if((r25|0)==(r23|0)){r26=r13+(r1+20)|0;r27=HEAP32[r26>>2];if((r27|0)==0){r28=r13+(r1+16)|0;r29=HEAP32[r28>>2];if((r29|0)==0){r30=0,r31=r30>>2;break}else{r32=r29;r33=r28}}else{r32=r27;r33=r26}while(1){r26=r32+20|0;r27=HEAP32[r26>>2];if((r27|0)!=0){r32=r27;r33=r26;continue}r26=r32+16|0;r27=HEAP32[r26>>2];if((r27|0)==0){break}else{r32=r27;r33=r26}}if(r33>>>0<r5>>>0){_abort()}else{HEAP32[r33>>2]=0;r30=r32,r31=r30>>2;break}}else{r26=HEAP32[r14+(r2+2)];if(r26>>>0<r5>>>0){_abort()}r27=r26+12|0;if((HEAP32[r27>>2]|0)!=(r23|0)){_abort()}r28=r25+8|0;if((HEAP32[r28>>2]|0)==(r23|0)){HEAP32[r27>>2]=r25;HEAP32[r28>>2]=r26;r30=r25,r31=r30>>2;break}else{_abort()}}}while(0);if((r18|0)==0){r19=r16,r20=r19>>2;r21=r17;break}r25=r13+(r1+28)|0;r15=(HEAP32[r25>>2]<<2)+3976|0;do{if((r23|0)==(HEAP32[r15>>2]|0)){HEAP32[r15>>2]=r30;if((r30|0)!=0){break}HEAP32[919]=HEAP32[919]&~(1<<HEAP32[r25>>2]);r19=r16,r20=r19>>2;r21=r17;break L3254}else{if(r18>>>0<HEAP32[922]>>>0){_abort()}r12=r18+16|0;if((HEAP32[r12>>2]|0)==(r23|0)){HEAP32[r12>>2]=r30}else{HEAP32[r18+20>>2]=r30}if((r30|0)==0){r19=r16,r20=r19>>2;r21=r17;break L3254}}}while(0);if(r30>>>0<HEAP32[922]>>>0){_abort()}HEAP32[r31+6]=r18;r23=HEAP32[r14+(r2+4)];do{if((r23|0)!=0){if(r23>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r31+4]=r23;HEAP32[r23+24>>2]=r30;break}}}while(0);r23=HEAP32[r14+(r2+5)];if((r23|0)==0){r19=r16,r20=r19>>2;r21=r17;break}if(r23>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r31+5]=r23;HEAP32[r23+24>>2]=r30;r19=r16,r20=r19>>2;r21=r17;break}}else{r19=r4,r20=r19>>2;r21=r8}}while(0);r4=r19,r30=r4>>2;if(r4>>>0>=r10>>>0){_abort()}r4=r1+(r8-4)|0;r31=HEAP32[r4>>2];if((r31&1|0)==0){_abort()}do{if((r31&2|0)==0){if((r11|0)==(HEAP32[924]|0)){r5=HEAP32[921]+r21|0;HEAP32[921]=r5;HEAP32[924]=r19;HEAP32[r20+1]=r5|1;if((r19|0)==(HEAP32[923]|0)){HEAP32[923]=0;HEAP32[920]=0}if(r5>>>0<=HEAP32[925]>>>0){return}_sys_trim(0);return}if((r11|0)==(HEAP32[923]|0)){r5=HEAP32[920]+r21|0;HEAP32[920]=r5;HEAP32[923]=r19;HEAP32[r20+1]=r5|1;HEAP32[(r5>>2)+r30]=r5;return}r5=(r31&-8)+r21|0;r32=r31>>>3;L3360:do{if(r31>>>0<256){r33=HEAP32[r2+r9];r24=HEAP32[((r8|4)>>2)+r2];r7=(r32<<3)+3712|0;do{if((r33|0)!=(r7|0)){if(r33>>>0<HEAP32[922]>>>0){_abort()}if((HEAP32[r33+12>>2]|0)==(r11|0)){break}_abort()}}while(0);if((r24|0)==(r33|0)){HEAP32[918]=HEAP32[918]&~(1<<r32);break}do{if((r24|0)==(r7|0)){r34=r24+8|0}else{if(r24>>>0<HEAP32[922]>>>0){_abort()}r3=r24+8|0;if((HEAP32[r3>>2]|0)==(r11|0)){r34=r3;break}_abort()}}while(0);HEAP32[r33+12>>2]=r24;HEAP32[r34>>2]=r33}else{r7=r10;r3=HEAP32[r9+(r2+4)];r6=HEAP32[((r8|4)>>2)+r2];do{if((r6|0)==(r7|0)){r23=r8+(r1+12)|0;r18=HEAP32[r23>>2];if((r18|0)==0){r25=r8+(r1+8)|0;r15=HEAP32[r25>>2];if((r15|0)==0){r35=0,r36=r35>>2;break}else{r37=r15;r38=r25}}else{r37=r18;r38=r23}while(1){r23=r37+20|0;r18=HEAP32[r23>>2];if((r18|0)!=0){r37=r18;r38=r23;continue}r23=r37+16|0;r18=HEAP32[r23>>2];if((r18|0)==0){break}else{r37=r18;r38=r23}}if(r38>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r38>>2]=0;r35=r37,r36=r35>>2;break}}else{r23=HEAP32[r2+r9];if(r23>>>0<HEAP32[922]>>>0){_abort()}r18=r23+12|0;if((HEAP32[r18>>2]|0)!=(r7|0)){_abort()}r25=r6+8|0;if((HEAP32[r25>>2]|0)==(r7|0)){HEAP32[r18>>2]=r6;HEAP32[r25>>2]=r23;r35=r6,r36=r35>>2;break}else{_abort()}}}while(0);if((r3|0)==0){break}r6=r8+(r1+20)|0;r33=(HEAP32[r6>>2]<<2)+3976|0;do{if((r7|0)==(HEAP32[r33>>2]|0)){HEAP32[r33>>2]=r35;if((r35|0)!=0){break}HEAP32[919]=HEAP32[919]&~(1<<HEAP32[r6>>2]);break L3360}else{if(r3>>>0<HEAP32[922]>>>0){_abort()}r24=r3+16|0;if((HEAP32[r24>>2]|0)==(r7|0)){HEAP32[r24>>2]=r35}else{HEAP32[r3+20>>2]=r35}if((r35|0)==0){break L3360}}}while(0);if(r35>>>0<HEAP32[922]>>>0){_abort()}HEAP32[r36+6]=r3;r7=HEAP32[r9+(r2+2)];do{if((r7|0)!=0){if(r7>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r36+4]=r7;HEAP32[r7+24>>2]=r35;break}}}while(0);r7=HEAP32[r9+(r2+3)];if((r7|0)==0){break}if(r7>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r36+5]=r7;HEAP32[r7+24>>2]=r35;break}}}while(0);HEAP32[r20+1]=r5|1;HEAP32[(r5>>2)+r30]=r5;if((r19|0)!=(HEAP32[923]|0)){r39=r5;break}HEAP32[920]=r5;return}else{HEAP32[r4>>2]=r31&-2;HEAP32[r20+1]=r21|1;HEAP32[(r21>>2)+r30]=r21;r39=r21}}while(0);r21=r39>>>3;if(r39>>>0<256){r30=r21<<1;r31=(r30<<2)+3712|0;r4=HEAP32[918];r35=1<<r21;do{if((r4&r35|0)==0){HEAP32[918]=r4|r35;r40=r31;r41=(r30+2<<2)+3712|0}else{r21=(r30+2<<2)+3712|0;r36=HEAP32[r21>>2];if(r36>>>0>=HEAP32[922]>>>0){r40=r36;r41=r21;break}_abort()}}while(0);HEAP32[r41>>2]=r19;HEAP32[r40+12>>2]=r19;HEAP32[r20+2]=r40;HEAP32[r20+3]=r31;return}r31=r19;r40=r39>>>8;do{if((r40|0)==0){r42=0}else{if(r39>>>0>16777215){r42=31;break}r41=(r40+1048320|0)>>>16&8;r30=r40<<r41;r35=(r30+520192|0)>>>16&4;r4=r30<<r35;r30=(r4+245760|0)>>>16&2;r21=14-(r35|r41|r30)+(r4<<r30>>>15)|0;r42=r39>>>((r21+7|0)>>>0)&1|r21<<1}}while(0);r40=(r42<<2)+3976|0;HEAP32[r20+7]=r42;HEAP32[r20+5]=0;HEAP32[r20+4]=0;r21=HEAP32[919];r30=1<<r42;L3446:do{if((r21&r30|0)==0){HEAP32[919]=r21|r30;HEAP32[r40>>2]=r31;HEAP32[r20+6]=r40;HEAP32[r20+3]=r19;HEAP32[r20+2]=r19}else{r4=HEAP32[r40>>2];if((r42|0)==31){r43=0}else{r43=25-(r42>>>1)|0}L3452:do{if((HEAP32[r4+4>>2]&-8|0)==(r39|0)){r44=r4}else{r41=r4;r35=r39<<r43;while(1){r45=(r35>>>31<<2)+r41+16|0;r36=HEAP32[r45>>2];if((r36|0)==0){break}if((HEAP32[r36+4>>2]&-8|0)==(r39|0)){r44=r36;break L3452}else{r41=r36;r35=r35<<1}}if(r45>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r45>>2]=r31;HEAP32[r20+6]=r41;HEAP32[r20+3]=r19;HEAP32[r20+2]=r19;break L3446}}}while(0);r4=r44+8|0;r5=HEAP32[r4>>2];r35=HEAP32[922];if(r44>>>0<r35>>>0){_abort()}if(r5>>>0<r35>>>0){_abort()}else{HEAP32[r5+12>>2]=r31;HEAP32[r4>>2]=r31;HEAP32[r20+2]=r5;HEAP32[r20+3]=r44;HEAP32[r20+6]=0;break}}}while(0);r20=HEAP32[926]-1|0;HEAP32[926]=r20;if((r20|0)==0){r46=4128}else{return}while(1){r20=HEAP32[r46>>2];if((r20|0)==0){break}else{r46=r20+8|0}}HEAP32[926]=-1;return}function _realloc(r1,r2){var r3,r4,r5,r6;if((r1|0)==0){r3=_malloc(r2);return r3}if(r2>>>0>4294967231){HEAP32[___errno_location()>>2]=12;r3=0;return r3}if(r2>>>0<11){r4=16}else{r4=r2+11&-8}r5=_try_realloc_chunk(r1-8|0,r4);if((r5|0)!=0){r3=r5+8|0;return r3}r5=_malloc(r2);if((r5|0)==0){r3=0;return r3}r4=HEAP32[r1-4>>2];r6=(r4&-8)-((r4&3|0)==0?8:4)|0;r4=r6>>>0<r2>>>0?r6:r2;_memcpy(r5,r1,r4)|0;_free(r1);r3=r5;return r3}function _sys_trim(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;do{if((HEAP32[646]|0)==0){r2=_sysconf(8);if((r2-1&r2|0)==0){HEAP32[648]=r2;HEAP32[647]=r2;HEAP32[649]=-1;HEAP32[650]=2097152;HEAP32[651]=0;HEAP32[1029]=0;HEAP32[646]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);if(r1>>>0>=4294967232){r3=0;return r3}r2=HEAP32[924];if((r2|0)==0){r3=0;return r3}r4=HEAP32[921];do{if(r4>>>0>(r1+40|0)>>>0){r5=HEAP32[648];r6=(((-40-r1-1+r4+r5|0)>>>0)/(r5>>>0)&-1)-1|0;r7=r2;r8=4120;while(1){r9=r8|0;r10=HEAP32[r9>>2];if(r10>>>0<=r7>>>0){r11=(r8+4|0)>>2;if((r10+HEAP32[r11]|0)>>>0>r7>>>0){break}}r8=HEAP32[r8+8>>2]}r7=Math.imul(r6,r5)|0;if((HEAP32[r8+12>>2]&8|0)!=0){break}r10=_sbrk(0);if((r10|0)!=(HEAP32[r9>>2]+HEAP32[r11]|0)){break}r12=_sbrk(-(r7>>>0>2147483646?-2147483648-r5|0:r7)|0);r7=_sbrk(0);if(!((r12|0)!=-1&r7>>>0<r10>>>0)){break}r12=r10-r7|0;if((r10|0)==(r7|0)){break}HEAP32[r11]=HEAP32[r11]-r12;HEAP32[1026]=HEAP32[1026]-r12;r13=HEAP32[924];r14=HEAP32[921]-r12|0;r12=r13;r15=r13+8|0;if((r15&7|0)==0){r16=0}else{r16=-r15&7}r15=r14-r16|0;HEAP32[924]=r12+r16;HEAP32[921]=r15;HEAP32[r16+(r12+4)>>2]=r15|1;HEAP32[r14+(r12+4)>>2]=40;HEAP32[925]=HEAP32[650];r3=(r10|0)!=(r7|0)|0;return r3}}while(0);if(HEAP32[921]>>>0<=HEAP32[925]>>>0){r3=0;return r3}HEAP32[925]=-1;r3=0;return r3}function _try_realloc_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r3=(r1+4|0)>>2;r4=HEAP32[r3];r5=r4&-8,r6=r5>>2;r7=r1,r8=r7>>2;r9=r7+r5|0;r10=r9;r11=HEAP32[922];if(r7>>>0<r11>>>0){_abort()}r12=r4&3;if(!((r12|0)!=1&r7>>>0<r9>>>0)){_abort()}r13=(r7+(r5|4)|0)>>2;r14=HEAP32[r13];if((r14&1|0)==0){_abort()}if((r12|0)==0){if(r2>>>0<256){r15=0;return r15}do{if(r5>>>0>=(r2+4|0)>>>0){if((r5-r2|0)>>>0>HEAP32[648]<<1>>>0){break}else{r15=r1}return r15}}while(0);r15=0;return r15}if(r5>>>0>=r2>>>0){r12=r5-r2|0;if(r12>>>0<=15){r15=r1;return r15}HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r12|3;HEAP32[r13]=HEAP32[r13]|1;_dispose_chunk(r7+r2|0,r12);r15=r1;return r15}if((r10|0)==(HEAP32[924]|0)){r12=HEAP32[921]+r5|0;if(r12>>>0<=r2>>>0){r15=0;return r15}r13=r12-r2|0;HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r13|1;HEAP32[924]=r7+r2;HEAP32[921]=r13;r15=r1;return r15}if((r10|0)==(HEAP32[923]|0)){r13=HEAP32[920]+r5|0;if(r13>>>0<r2>>>0){r15=0;return r15}r12=r13-r2|0;if(r12>>>0>15){HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r12|1;HEAP32[(r13>>2)+r8]=r12;r16=r13+(r7+4)|0;HEAP32[r16>>2]=HEAP32[r16>>2]&-2;r17=r7+r2|0;r18=r12}else{HEAP32[r3]=r4&1|r13|2;r4=r13+(r7+4)|0;HEAP32[r4>>2]=HEAP32[r4>>2]|1;r17=0;r18=0}HEAP32[920]=r18;HEAP32[923]=r17;r15=r1;return r15}if((r14&2|0)!=0){r15=0;return r15}r17=(r14&-8)+r5|0;if(r17>>>0<r2>>>0){r15=0;return r15}r18=r17-r2|0;r4=r14>>>3;L3581:do{if(r14>>>0<256){r13=HEAP32[r6+(r8+2)];r12=HEAP32[r6+(r8+3)];r16=(r4<<3)+3712|0;do{if((r13|0)!=(r16|0)){if(r13>>>0<r11>>>0){_abort()}if((HEAP32[r13+12>>2]|0)==(r10|0)){break}_abort()}}while(0);if((r12|0)==(r13|0)){HEAP32[918]=HEAP32[918]&~(1<<r4);break}do{if((r12|0)==(r16|0)){r19=r12+8|0}else{if(r12>>>0<r11>>>0){_abort()}r20=r12+8|0;if((HEAP32[r20>>2]|0)==(r10|0)){r19=r20;break}_abort()}}while(0);HEAP32[r13+12>>2]=r12;HEAP32[r19>>2]=r13}else{r16=r9;r20=HEAP32[r6+(r8+6)];r21=HEAP32[r6+(r8+3)];do{if((r21|0)==(r16|0)){r22=r5+(r7+20)|0;r23=HEAP32[r22>>2];if((r23|0)==0){r24=r5+(r7+16)|0;r25=HEAP32[r24>>2];if((r25|0)==0){r26=0,r27=r26>>2;break}else{r28=r25;r29=r24}}else{r28=r23;r29=r22}while(1){r22=r28+20|0;r23=HEAP32[r22>>2];if((r23|0)!=0){r28=r23;r29=r22;continue}r22=r28+16|0;r23=HEAP32[r22>>2];if((r23|0)==0){break}else{r28=r23;r29=r22}}if(r29>>>0<r11>>>0){_abort()}else{HEAP32[r29>>2]=0;r26=r28,r27=r26>>2;break}}else{r22=HEAP32[r6+(r8+2)];if(r22>>>0<r11>>>0){_abort()}r23=r22+12|0;if((HEAP32[r23>>2]|0)!=(r16|0)){_abort()}r24=r21+8|0;if((HEAP32[r24>>2]|0)==(r16|0)){HEAP32[r23>>2]=r21;HEAP32[r24>>2]=r22;r26=r21,r27=r26>>2;break}else{_abort()}}}while(0);if((r20|0)==0){break}r21=r5+(r7+28)|0;r13=(HEAP32[r21>>2]<<2)+3976|0;do{if((r16|0)==(HEAP32[r13>>2]|0)){HEAP32[r13>>2]=r26;if((r26|0)!=0){break}HEAP32[919]=HEAP32[919]&~(1<<HEAP32[r21>>2]);break L3581}else{if(r20>>>0<HEAP32[922]>>>0){_abort()}r12=r20+16|0;if((HEAP32[r12>>2]|0)==(r16|0)){HEAP32[r12>>2]=r26}else{HEAP32[r20+20>>2]=r26}if((r26|0)==0){break L3581}}}while(0);if(r26>>>0<HEAP32[922]>>>0){_abort()}HEAP32[r27+6]=r20;r16=HEAP32[r6+(r8+4)];do{if((r16|0)!=0){if(r16>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r27+4]=r16;HEAP32[r16+24>>2]=r26;break}}}while(0);r16=HEAP32[r6+(r8+5)];if((r16|0)==0){break}if(r16>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r27+5]=r16;HEAP32[r16+24>>2]=r26;break}}}while(0);if(r18>>>0<16){HEAP32[r3]=r17|HEAP32[r3]&1|2;r26=r7+(r17|4)|0;HEAP32[r26>>2]=HEAP32[r26>>2]|1;r15=r1;return r15}else{HEAP32[r3]=HEAP32[r3]&1|r2|2;HEAP32[(r2+4>>2)+r8]=r18|3;r8=r7+(r17|4)|0;HEAP32[r8>>2]=HEAP32[r8>>2]|1;_dispose_chunk(r7+r2|0,r18);r15=r1;return r15}}function _dispose_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42;r3=r2>>2;r4=r1,r5=r4>>2;r6=r4+r2|0;r7=r6;r8=HEAP32[r1+4>>2];L3657:do{if((r8&1|0)==0){r9=HEAP32[r1>>2];if((r8&3|0)==0){return}r10=r4+ -r9|0;r11=r10;r12=r9+r2|0;r13=HEAP32[922];if(r10>>>0<r13>>>0){_abort()}if((r11|0)==(HEAP32[923]|0)){r14=(r2+(r4+4)|0)>>2;if((HEAP32[r14]&3|0)!=3){r15=r11,r16=r15>>2;r17=r12;break}HEAP32[920]=r12;HEAP32[r14]=HEAP32[r14]&-2;HEAP32[(4-r9>>2)+r5]=r12|1;HEAP32[r6>>2]=r12;return}r14=r9>>>3;if(r9>>>0<256){r18=HEAP32[(8-r9>>2)+r5];r19=HEAP32[(12-r9>>2)+r5];r20=(r14<<3)+3712|0;do{if((r18|0)!=(r20|0)){if(r18>>>0<r13>>>0){_abort()}if((HEAP32[r18+12>>2]|0)==(r11|0)){break}_abort()}}while(0);if((r19|0)==(r18|0)){HEAP32[918]=HEAP32[918]&~(1<<r14);r15=r11,r16=r15>>2;r17=r12;break}do{if((r19|0)==(r20|0)){r21=r19+8|0}else{if(r19>>>0<r13>>>0){_abort()}r22=r19+8|0;if((HEAP32[r22>>2]|0)==(r11|0)){r21=r22;break}_abort()}}while(0);HEAP32[r18+12>>2]=r19;HEAP32[r21>>2]=r18;r15=r11,r16=r15>>2;r17=r12;break}r20=r10;r14=HEAP32[(24-r9>>2)+r5];r22=HEAP32[(12-r9>>2)+r5];do{if((r22|0)==(r20|0)){r23=16-r9|0;r24=r23+(r4+4)|0;r25=HEAP32[r24>>2];if((r25|0)==0){r26=r4+r23|0;r23=HEAP32[r26>>2];if((r23|0)==0){r27=0,r28=r27>>2;break}else{r29=r23;r30=r26}}else{r29=r25;r30=r24}while(1){r24=r29+20|0;r25=HEAP32[r24>>2];if((r25|0)!=0){r29=r25;r30=r24;continue}r24=r29+16|0;r25=HEAP32[r24>>2];if((r25|0)==0){break}else{r29=r25;r30=r24}}if(r30>>>0<r13>>>0){_abort()}else{HEAP32[r30>>2]=0;r27=r29,r28=r27>>2;break}}else{r24=HEAP32[(8-r9>>2)+r5];if(r24>>>0<r13>>>0){_abort()}r25=r24+12|0;if((HEAP32[r25>>2]|0)!=(r20|0)){_abort()}r26=r22+8|0;if((HEAP32[r26>>2]|0)==(r20|0)){HEAP32[r25>>2]=r22;HEAP32[r26>>2]=r24;r27=r22,r28=r27>>2;break}else{_abort()}}}while(0);if((r14|0)==0){r15=r11,r16=r15>>2;r17=r12;break}r22=r4+(28-r9)|0;r13=(HEAP32[r22>>2]<<2)+3976|0;do{if((r20|0)==(HEAP32[r13>>2]|0)){HEAP32[r13>>2]=r27;if((r27|0)!=0){break}HEAP32[919]=HEAP32[919]&~(1<<HEAP32[r22>>2]);r15=r11,r16=r15>>2;r17=r12;break L3657}else{if(r14>>>0<HEAP32[922]>>>0){_abort()}r10=r14+16|0;if((HEAP32[r10>>2]|0)==(r20|0)){HEAP32[r10>>2]=r27}else{HEAP32[r14+20>>2]=r27}if((r27|0)==0){r15=r11,r16=r15>>2;r17=r12;break L3657}}}while(0);if(r27>>>0<HEAP32[922]>>>0){_abort()}HEAP32[r28+6]=r14;r20=16-r9|0;r22=HEAP32[(r20>>2)+r5];do{if((r22|0)!=0){if(r22>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r28+4]=r22;HEAP32[r22+24>>2]=r27;break}}}while(0);r22=HEAP32[(r20+4>>2)+r5];if((r22|0)==0){r15=r11,r16=r15>>2;r17=r12;break}if(r22>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r28+5]=r22;HEAP32[r22+24>>2]=r27;r15=r11,r16=r15>>2;r17=r12;break}}else{r15=r1,r16=r15>>2;r17=r2}}while(0);r1=HEAP32[922];if(r6>>>0<r1>>>0){_abort()}r27=r2+(r4+4)|0;r28=HEAP32[r27>>2];do{if((r28&2|0)==0){if((r7|0)==(HEAP32[924]|0)){r29=HEAP32[921]+r17|0;HEAP32[921]=r29;HEAP32[924]=r15;HEAP32[r16+1]=r29|1;if((r15|0)!=(HEAP32[923]|0)){return}HEAP32[923]=0;HEAP32[920]=0;return}if((r7|0)==(HEAP32[923]|0)){r29=HEAP32[920]+r17|0;HEAP32[920]=r29;HEAP32[923]=r15;HEAP32[r16+1]=r29|1;HEAP32[(r29>>2)+r16]=r29;return}r29=(r28&-8)+r17|0;r30=r28>>>3;L3756:do{if(r28>>>0<256){r21=HEAP32[r3+(r5+2)];r8=HEAP32[r3+(r5+3)];r22=(r30<<3)+3712|0;do{if((r21|0)!=(r22|0)){if(r21>>>0<r1>>>0){_abort()}if((HEAP32[r21+12>>2]|0)==(r7|0)){break}_abort()}}while(0);if((r8|0)==(r21|0)){HEAP32[918]=HEAP32[918]&~(1<<r30);break}do{if((r8|0)==(r22|0)){r31=r8+8|0}else{if(r8>>>0<r1>>>0){_abort()}r9=r8+8|0;if((HEAP32[r9>>2]|0)==(r7|0)){r31=r9;break}_abort()}}while(0);HEAP32[r21+12>>2]=r8;HEAP32[r31>>2]=r21}else{r22=r6;r9=HEAP32[r3+(r5+6)];r14=HEAP32[r3+(r5+3)];do{if((r14|0)==(r22|0)){r13=r2+(r4+20)|0;r10=HEAP32[r13>>2];if((r10|0)==0){r18=r2+(r4+16)|0;r19=HEAP32[r18>>2];if((r19|0)==0){r32=0,r33=r32>>2;break}else{r34=r19;r35=r18}}else{r34=r10;r35=r13}while(1){r13=r34+20|0;r10=HEAP32[r13>>2];if((r10|0)!=0){r34=r10;r35=r13;continue}r13=r34+16|0;r10=HEAP32[r13>>2];if((r10|0)==0){break}else{r34=r10;r35=r13}}if(r35>>>0<r1>>>0){_abort()}else{HEAP32[r35>>2]=0;r32=r34,r33=r32>>2;break}}else{r13=HEAP32[r3+(r5+2)];if(r13>>>0<r1>>>0){_abort()}r10=r13+12|0;if((HEAP32[r10>>2]|0)!=(r22|0)){_abort()}r18=r14+8|0;if((HEAP32[r18>>2]|0)==(r22|0)){HEAP32[r10>>2]=r14;HEAP32[r18>>2]=r13;r32=r14,r33=r32>>2;break}else{_abort()}}}while(0);if((r9|0)==0){break}r14=r2+(r4+28)|0;r21=(HEAP32[r14>>2]<<2)+3976|0;do{if((r22|0)==(HEAP32[r21>>2]|0)){HEAP32[r21>>2]=r32;if((r32|0)!=0){break}HEAP32[919]=HEAP32[919]&~(1<<HEAP32[r14>>2]);break L3756}else{if(r9>>>0<HEAP32[922]>>>0){_abort()}r8=r9+16|0;if((HEAP32[r8>>2]|0)==(r22|0)){HEAP32[r8>>2]=r32}else{HEAP32[r9+20>>2]=r32}if((r32|0)==0){break L3756}}}while(0);if(r32>>>0<HEAP32[922]>>>0){_abort()}HEAP32[r33+6]=r9;r22=HEAP32[r3+(r5+4)];do{if((r22|0)!=0){if(r22>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r33+4]=r22;HEAP32[r22+24>>2]=r32;break}}}while(0);r22=HEAP32[r3+(r5+5)];if((r22|0)==0){break}if(r22>>>0<HEAP32[922]>>>0){_abort()}else{HEAP32[r33+5]=r22;HEAP32[r22+24>>2]=r32;break}}}while(0);HEAP32[r16+1]=r29|1;HEAP32[(r29>>2)+r16]=r29;if((r15|0)!=(HEAP32[923]|0)){r36=r29;break}HEAP32[920]=r29;return}else{HEAP32[r27>>2]=r28&-2;HEAP32[r16+1]=r17|1;HEAP32[(r17>>2)+r16]=r17;r36=r17}}while(0);r17=r36>>>3;if(r36>>>0<256){r28=r17<<1;r27=(r28<<2)+3712|0;r32=HEAP32[918];r33=1<<r17;do{if((r32&r33|0)==0){HEAP32[918]=r32|r33;r37=r27;r38=(r28+2<<2)+3712|0}else{r17=(r28+2<<2)+3712|0;r5=HEAP32[r17>>2];if(r5>>>0>=HEAP32[922]>>>0){r37=r5;r38=r17;break}_abort()}}while(0);HEAP32[r38>>2]=r15;HEAP32[r37+12>>2]=r15;HEAP32[r16+2]=r37;HEAP32[r16+3]=r27;return}r27=r15;r37=r36>>>8;do{if((r37|0)==0){r39=0}else{if(r36>>>0>16777215){r39=31;break}r38=(r37+1048320|0)>>>16&8;r28=r37<<r38;r33=(r28+520192|0)>>>16&4;r32=r28<<r33;r28=(r32+245760|0)>>>16&2;r17=14-(r33|r38|r28)+(r32<<r28>>>15)|0;r39=r36>>>((r17+7|0)>>>0)&1|r17<<1}}while(0);r37=(r39<<2)+3976|0;HEAP32[r16+7]=r39;HEAP32[r16+5]=0;HEAP32[r16+4]=0;r17=HEAP32[919];r28=1<<r39;if((r17&r28|0)==0){HEAP32[919]=r17|r28;HEAP32[r37>>2]=r27;HEAP32[r16+6]=r37;HEAP32[r16+3]=r15;HEAP32[r16+2]=r15;return}r28=HEAP32[r37>>2];if((r39|0)==31){r40=0}else{r40=25-(r39>>>1)|0}L3850:do{if((HEAP32[r28+4>>2]&-8|0)==(r36|0)){r41=r28}else{r39=r28;r37=r36<<r40;while(1){r42=(r37>>>31<<2)+r39+16|0;r17=HEAP32[r42>>2];if((r17|0)==0){break}if((HEAP32[r17+4>>2]&-8|0)==(r36|0)){r41=r17;break L3850}else{r39=r17;r37=r37<<1}}if(r42>>>0<HEAP32[922]>>>0){_abort()}HEAP32[r42>>2]=r27;HEAP32[r16+6]=r39;HEAP32[r16+3]=r15;HEAP32[r16+2]=r15;return}}while(0);r15=r41+8|0;r42=HEAP32[r15>>2];r36=HEAP32[922];if(r41>>>0<r36>>>0){_abort()}if(r42>>>0<r36>>>0){_abort()}HEAP32[r42+12>>2]=r27;HEAP32[r15>>2]=r27;HEAP32[r16+2]=r42;HEAP32[r16+3]=r41;HEAP32[r16+6]=0;return}function _i64Add(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1+r3>>>0;r6=r2+r4+(r5>>>0<r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _i64Subtract(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1-r3>>>0;r6=r2-r4>>>0;r6=r2-r4-(r3>>>0>r1>>>0|0)>>>0;return tempRet0=r6,r5|0}function _bitshift64Shl(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2<<r3|(r1&r4<<32-r3)>>>32-r3;return r1<<r3}tempRet0=r1<<r3-32;return 0}function _bitshift64Lshr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=0;return r2>>>r3-32|0}function _bitshift64Ashr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=(r2|0)<0?-1:0;return r2>>r3-32|0}function _llvm_ctlz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[ctlz_i8+(r1>>>24)|0];if((r2|0)<8)return r2|0;r2=HEAP8[ctlz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[ctlz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[ctlz_i8+(r1&255)|0]+24|0}var ctlz_i8=allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"i8",ALLOC_DYNAMIC);function _llvm_cttz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[cttz_i8+(r1&255)|0];if((r2|0)<8)return r2|0;r2=HEAP8[cttz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[cttz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[cttz_i8+(r1>>>24)|0]+24|0}var cttz_i8=allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0],"i8",ALLOC_DYNAMIC);function ___muldsi3(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=0,r4=0,r5=0,r6=0,r7=0,r8=0,r9=0;r3=r1&65535;r4=r2&65535;r5=Math.imul(r4,r3)|0;r6=r1>>>16;r7=(r5>>>16)+Math.imul(r4,r6)|0;r8=r2>>>16;r9=Math.imul(r8,r3)|0;return(tempRet0=(r7>>>16)+Math.imul(r8,r6)+(((r7&65535)+r9|0)>>>16)|0,r7+r9<<16|r5&65535|0)|0}function ___divdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r5=r2>>31|((r2|0)<0?-1:0)<<1;r6=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r7=r4>>31|((r4|0)<0?-1:0)<<1;r8=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r9=_i64Subtract(r5^r1,r6^r2,r5,r6)|0;r10=tempRet0;r11=_i64Subtract(r7^r3,r8^r4,r7,r8)|0;r12=r7^r5;r13=r8^r6;r14=___udivmoddi4(r9,r10,r11,tempRet0,0)|0;r15=_i64Subtract(r14^r12,tempRet0^r13,r12,r13)|0;return(tempRet0=tempRet0,r15)|0}function ___remdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r15=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r15|0;r6=r2>>31|((r2|0)<0?-1:0)<<1;r7=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r8=r4>>31|((r4|0)<0?-1:0)<<1;r9=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r10=_i64Subtract(r6^r1,r7^r2,r6,r7)|0;r11=tempRet0;r12=_i64Subtract(r8^r3,r9^r4,r8,r9)|0;___udivmoddi4(r10,r11,r12,tempRet0,r5)|0;r13=_i64Subtract(HEAP32[r5>>2]^r6,HEAP32[r5+4>>2]^r7,r6,r7)|0;r14=tempRet0;STACKTOP=r15;return(tempRet0=r14,r13)|0}function ___muldi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0;r5=r1;r6=r3;r7=___muldsi3(r5,r6)|0;r8=tempRet0;r9=Math.imul(r2,r6)|0;return(tempRet0=Math.imul(r4,r5)+r9+r8|r8&0,r7&-1|0)|0}function ___udivdi3(r1,r2,r3,r4){var r5;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0;r5=___udivmoddi4(r1,r2,r3,r4,0)|0;return(tempRet0=tempRet0,r5)|0}function ___uremdi3(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r6|0;___udivmoddi4(r1,r2,r3,r4,r5)|0;STACKTOP=r6;return(tempRet0=HEAP32[r5+4>>2]|0,HEAP32[r5>>2]|0)|0}function ___udivmoddi4(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=r5|0;r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0,r16=0,r17=0,r18=0,r19=0,r20=0,r21=0,r22=0,r23=0,r24=0,r25=0,r26=0,r27=0,r28=0,r29=0,r30=0,r31=0,r32=0,r33=0,r34=0,r35=0,r36=0,r37=0,r38=0,r39=0,r40=0,r41=0,r42=0,r43=0,r44=0,r45=0,r46=0,r47=0,r48=0,r49=0,r50=0,r51=0,r52=0,r53=0,r54=0,r55=0,r56=0,r57=0,r58=0,r59=0,r60=0,r61=0,r62=0,r63=0,r64=0,r65=0,r66=0,r67=0,r68=0,r69=0;r6=r1;r7=r2;r8=r7;r9=r3;r10=r4;r11=r10;if((r8|0)==0){r12=(r5|0)!=0;if((r11|0)==0){if(r12){HEAP32[r5>>2]=(r6>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r6>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}else{if(!r12){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}}r13=(r11|0)==0;do{if((r9|0)==0){if(r13){if((r5|0)!=0){HEAP32[r5>>2]=(r8>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r8>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}if((r6|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=0;HEAP32[r5+4>>2]=(r8>>>0)%(r11>>>0)}r69=0;r68=(r8>>>0)/(r11>>>0)>>>0;return(tempRet0=r69,r68)|0}r14=r11-1|0;if((r14&r11|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r14&r8|r2&0}r69=0;r68=r8>>>((_llvm_cttz_i32(r11|0)|0)>>>0);return(tempRet0=r69,r68)|0}r15=_llvm_ctlz_i32(r11|0)|0;r16=r15-_llvm_ctlz_i32(r8|0)|0;if(r16>>>0<=30){r17=r16+1|0;r18=31-r16|0;r37=r17;r36=r8<<r18|r6>>>(r17>>>0);r35=r8>>>(r17>>>0);r34=0;r33=r6<<r18;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}else{if(!r13){r28=_llvm_ctlz_i32(r11|0)|0;r29=r28-_llvm_ctlz_i32(r8|0)|0;if(r29>>>0<=31){r30=r29+1|0;r31=31-r29|0;r32=r29-31>>31;r37=r30;r36=r6>>>(r30>>>0)&r32|r8<<r31;r35=r8>>>(r30>>>0)&r32;r34=0;r33=r6<<r31;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}r19=r9-1|0;if((r19&r9|0)!=0){r21=_llvm_ctlz_i32(r9|0)+33|0;r22=r21-_llvm_ctlz_i32(r8|0)|0;r23=64-r22|0;r24=32-r22|0;r25=r24>>31;r26=r22-32|0;r27=r26>>31;r37=r22;r36=r24-1>>31&r8>>>(r26>>>0)|(r8<<r24|r6>>>(r22>>>0))&r27;r35=r27&r8>>>(r22>>>0);r34=r6<<r23&r25;r33=(r8<<r23|r6>>>(r26>>>0))&r25|r6<<r24&r22-33>>31;break}if((r5|0)!=0){HEAP32[r5>>2]=r19&r6;HEAP32[r5+4>>2]=0}if((r9|0)==1){r69=r7|r2&0;r68=r1&-1|0;return(tempRet0=r69,r68)|0}else{r20=_llvm_cttz_i32(r9|0)|0;r69=r8>>>(r20>>>0)|0;r68=r8<<32-r20|r6>>>(r20>>>0)|0;return(tempRet0=r69,r68)|0}}}while(0);if((r37|0)==0){r64=r33;r63=r34;r62=r35;r61=r36;r60=0;r59=0}else{r38=r3&-1|0;r39=r10|r4&0;r40=_i64Add(r38,r39,-1,-1)|0;r41=tempRet0;r47=r33;r46=r34;r45=r35;r44=r36;r43=r37;r42=0;while(1){r48=r46>>>31|r47<<1;r49=r42|r46<<1;r50=r44<<1|r47>>>31|0;r51=r44>>>31|r45<<1|0;_i64Subtract(r40,r41,r50,r51)|0;r52=tempRet0;r53=r52>>31|((r52|0)<0?-1:0)<<1;r54=r53&1;r55=_i64Subtract(r50,r51,r53&r38,(((r52|0)<0?-1:0)>>31|((r52|0)<0?-1:0)<<1)&r39)|0;r56=r55;r57=tempRet0;r58=r43-1|0;if((r58|0)==0){break}else{r47=r48;r46=r49;r45=r57;r44=r56;r43=r58;r42=r54}}r64=r48;r63=r49;r62=r57;r61=r56;r60=0;r59=r54}r65=r63;r66=0;r67=r64|r66;if((r5|0)!=0){HEAP32[r5>>2]=r61;HEAP32[r5+4>>2]=r62}r69=(r65|0)>>>31|r67<<1|(r66<<1|r65>>>31)&0|r60;r68=(r65<<1|0>>>31)&-2|r59;return(tempRet0=r69,r68)|0}
// EMSCRIPTEN_END_FUNCS
Module["_get_item_from_archive_list"] = _get_item_from_archive_list;
Module["_get_next_from_archive_list"] = _get_next_from_archive_list;
Module["_get_name_from_archive_entry"] = _get_name_from_archive_entry;
Module["_get_pack_size_from_archive_entry"] = _get_pack_size_from_archive_entry;
Module["_get_unp_size_from_archive_entry"] = _get_unp_size_from_archive_entry;
Module["_get_host_os_from_archive_entry"] = _get_host_os_from_archive_entry;
Module["_get_file_time_from_archive_entry"] = _get_file_time_from_archive_entry;
Module["_get_file_attr_from_archive_entry"] = _get_file_attr_from_archive_entry;
Module["_urarlib_get"] = _urarlib_get;
Module["_urarlib_list"] = _urarlib_list;
Module["_urarlib_freelist"] = _urarlib_freelist;
Module["_malloc"] = _malloc;
Module["_free"] = _free;
Module["_realloc"] = _realloc;
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
var initialStackTop;
var inMain;
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  inMain = true;
  var ret;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e && typeof e == 'object' && e.type == 'ExitStatus') {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      Module.print('Exit Status: ' + e.value);
      return e.value;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    inMain = false;
  }
  // if we're not running an evented main loop, it's time to exit
  if (!Module['noExitRuntime']) {
    exit(ret);
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  STACKTOP = initialStackTop;
  // TODO call externally added 'exit' callbacks with the status code.
  // It'd be nice to provide the same interface for all Module events (e.g.
  // prerun, premain, postmain). Perhaps an EventEmitter so we can do:
  // Module.on('exit', function (status) {});
  // exit the runtime
  exitRuntime();
  if (inMain) {
    // if we're still inside the callMain's try/catch, we need to throw an
    // exception in order to immediately terminate execution.
    throw { type: 'ExitStatus', value: status };
  }
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
  }
  ABORT = true;
  throw 'abort() at ' + (new Error().stack);
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
// export.js

var malloc = cwrap('malloc', 'number', ['number']);
var free = cwrap('free', 'number', ['number']);

var urarlib_list = cwrap('urarlib_list', 'number', ['string', 'number']);
var urarlib_freelist = cwrap('urarlib_freelist', 'number', ['number']);
var urarlib_get = cwrap('urarlib_get', 'number', ['number', 'number', 'number', 'string', 'string']);

var get_item_from_archive_list = cwrap('get_item_from_archive_list', 'number', ['number']);
var get_next_from_archive_list = cwrap('get_next_from_archive_list', 'number', ['number']);

var get_name_from_archive_entry = cwrap('get_name_from_archive_entry', 'number', ['number']);
var get_pack_size_from_archive_entry = cwrap('get_pack_size_from_archive_entry', 'number', ['number']);
var get_unp_size_from_archive_entry = cwrap('get_unp_size_from_archive_entry', 'number', ['number']);
var get_host_os_from_archive_entry = cwrap('get_host_os_from_archive_entry', 'number', ['number']);
var get_file_time_from_archive_entry = cwrap('get_file_time_from_archive_entry', 'number', ['number']);
var get_file_attr_from_archive_entry = cwrap('get_file_attr_from_archive_entry', 'number', ['number']);

var RarArchiveEntry = (function () {
  function RarArchiveEntry(entryPtr) {
    this.entryPtr = entryPtr;
    this.name = Pointer_stringify(get_name_from_archive_entry(this.entryPtr));
    this.packSize = get_pack_size_from_archive_entry(this.entryPtr);
    this.unpackSize = get_unp_size_from_archive_entry(this.entryPtr);
    this.hostOS = get_host_os_from_archive_entry(this.entryPtr);
    this.fileTime = get_file_time_from_archive_entry(this.entryPtr);
    this.fileAttr = get_file_attr_from_archive_entry(this.entryPtr);
  }
  RarArchiveEntry.prototype['isDirectory'] = function () {
    return (get_file_attr_from_archive_entry(this.entryPtr) & 0x10) > 0;
  };
  return RarArchiveEntry;
})();

var Unrar = (function () {
  var fileid = 0;

  function Unrar(arraybuffer, password) {
    this.buffer = arraybuffer;
    this.password = password || '';
    this.archiveName = (++fileid) + '.rar';
    this.listPtr = malloc(0);
    this.filenameToPtr = {};
    this.entries = [];

    FS.createDataFile('/', this.archiveName, new Uint8Array(this.buffer), true, false);

    var fileNum = urarlib_list(this.archiveName, this.listPtr);
    var next = getValue(this.listPtr, 'i32*');
    while (next !== 0) {
      var entry =new RarArchiveEntry(get_item_from_archive_list(next));
      var namePtr = get_name_from_archive_entry(entry.entryPtr);
      this.filenameToPtr[entry.name] = namePtr;
      this.entries.push(entry);
      next = get_next_from_archive_list(next);
    }
  }
  Unrar.prototype['getEntries'] = function () {
    return this.entries;
  };
  Unrar.prototype['close'] = function () {
    urarlib_freelist(getValue(this.listPtr, 'i32*'));
    free(this.listPtr);
    FS.deleteFile('/' + this.archiveName);
  };
  Unrar.prototype['decompress'] = function (filename) {
    var sizePtr = malloc(4);
    var outputPtr = malloc(0);

    var result = urarlib_get(outputPtr, sizePtr,
                             this.filenameToPtr[filename],
                             this.archiveName,
                             this.password);
    var size = getValue(sizePtr, 'i32*');
    var data = null;
    if (result === 1) {
      var begin = getValue(outputPtr, 'i8*');
      data = new Uint8Array(HEAPU8.subarray(begin, begin + size));
    }
    free(getValue(outputPtr, 'i8*'));
    free(outputPtr);
    free(sizePtr);
    return data;
  };
  return Unrar;
})();

if (typeof process === 'object' && typeof require === 'function') { // NODE
  module.exports = Unrar;
} else if (typeof define === "function" && define.amd) { // AMD
  define('unrar', [], function () { return Unrar; });
} else if (typeof window === 'object') { // WEB
  window['Unrar'] = Unrar;
} else if (typeof importScripts === 'function') { // WORKER
  this['Unrar'] = Unrar;
}
