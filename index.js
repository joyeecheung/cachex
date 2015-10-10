'use strict';

var debug = require('debug')('cachex');

/**
 * @param {Object} store The cache store client, must have set(key, value, time)
 * and get(key) methods, the get/set must be an yieldable method
 * @param {String} prefix prefix, used for key
 * @param {String} name method name, used for key
 * @param {Generator|Thunkify} yieldable must be a yieldable object
 * @param {Number} expire the expire time, in seconds
 * @return Generator the new generator, will auto process cache
 */
module.exports = function (store, prefix, name, yieldable, expire) {
  return function * () {
    // copy arguments
    var args = new Array(arguments.length);
    for (var i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }
    var key = prefix + ':' + name + ':' + args.join(':');
    var result = yield store.get(key);
    debug('get value for key: %s with cache, value is: %j', key, result);
    if (!result) {
      result = yield* yieldable.apply(null, arguments);
      debug('get value for key: %s with origin way', key);
      if (result) {
        yield store.set(key, result, expire);
      }
    }
    return result;
  };
};