/**
 * @module utils
 *
 * @description A utilities component with useful functions
 *
 * @exports utils
 */
const utils = {
  /** @function calculateDelayMS
   *  @description Calculates the difference in delay relative to now
   *
   *  @param {integer} delayTS Desired UTC time to delay to
   *  @returns {integer} Number of milliseconds `delayTS` is in the future
   *    If `delayTS` is now or in the past, it will return 0
   */
  calculateDelayMS: delayTS => Math.max(delayTS - Date.now(), 0),

  /** @function calculateDelayTS
   *  @description Calculates the delay relative to a provided timestamp
   *
   *  @param {integer} delay Number of milliseconds to delay
   *  @param {integer} timestamp Reference UTC time
   *  @returns {integer} A UTC time with the delay added
   */
  calculateDelayTS: (delay, timestamp) => timestamp + delay,

  /** @function dropNullAndUndefinedObject
   *  @description Recursively removes any null or undefined properties in an object
   *
   *  @param {object} obj - The object to operate on
   *  @returns {object} The object `obj` without null and undefined properties
   */
  dropNullAndUndefinedObject: obj => {
    Object.entries(obj).forEach(([key, val]) => {
      if (val && typeof val === 'object') utils.dropNullAndUndefinedObject(val);
      else if (val == null) delete obj[key];
    });
    return obj;
  },

  /** @function filterUndefinedAndEmptyArray
   *  @description Returns a new object where undefined and empty arrays are dropped
   *
   *  @param {object} obj A JSON Object
   *  @returns {object} A JSON Object without empty arrays and undefined properties
   */
  filterUndefinedAndEmptyArray: obj => {
    const ret = {};
    Object.keys(obj)
      .filter((key) => obj[key] !== undefined && obj[key].length)
      .forEach((key) => ret[key] = obj[key]);
    return ret;
  },

  /** @function prettyStringify
   *  @description Returns a pretty JSON representation of an object
   *
   *  @param {object} obj A JSON Object
   *  @param {integer} indent Number of spaces to indent
   *  @returns {string} A pretty printed string representation of `obj` with `indent` indentation
   */
  prettyStringify: (obj, indent = 2) => JSON.stringify(obj, null, indent),

  /** @function toPascalCase
   *  @description Returns a string in Pascal Case
   *
   *  @param {string} str A string
   *  @returns {string} A string formatted in Pascal Case
   */
  toPascalCase: str => str.toLowerCase().replace(/\b\w/g, t => t.toUpperCase()),

  /** @function wait
   *  @description A blocking sleep/wait function - https://stackoverflow.com/a/39914235
   *
   *  @param {integer} ms Number of milliseconds to wait
   *  @returns A promise after `ms` milliseconds
   */
  wait: ms => new Promise(r => setTimeout(r, ms))
};

module.exports = utils;
