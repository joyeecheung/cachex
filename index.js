'use strict';

var debug = require('debug')('cachex');

/**
 * The cachex will hook an method auto save data into cache and read data
 * from cache
 *
 * @param {Object} store The cache store client, must have
 * set(key, value, time), get(key) and del(key) methods,
 * the get/set/del must be an yieldable method
 * @param {String} prefix prefix, used for key
 * @param {String} name method name, used for key
 * @param {Generator|Thunkify} yieldable must be a yieldable object
 * @param {Number} expire the expire time, in seconds
 * @return Generator the new generator, will auto process cache
 */
var cachex = function (store, prefix, name, yieldable, expire) {
  return function * () {
    // copy arguments
    var args = new Array(arguments.length);
    for (var i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
      if (typeof args[i] === 'object') {
        throw new TypeError('use object not fit cache key');
      }
    }
    var key = prefix + ':' + name + ':' + args.join(':');
    var result = yield store.get(key);
    debug('get value for key: %s with cache, value is: %j', key, result);
    if (!result) {
      result = yield yieldable.apply(null, args);
      debug('get value for key: %s with origin way', key);
      if (result) {
        debug('save %j for key: %s with %ds', result, key, expire);
        yield store.set(key, result, expire);
      }
    }
    return result;
  };
};

/**
 * Remove data from cache with key
 * @param {Object} store The cache store client, must have
 * set(key, value, time), get(key) and del(key) methods,
 * the get/set/del must be an yieldable method
 * @param {String} prefix prefix, used for key
 * @param {String} key the key, used for key
 */
cachex.del = function * (store, prefix, key) {
  yield store.del(prefix + ':' + key);
};

module.exports = cachex;
