const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

const log = require('./log')(module.filename);

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

  /** @function dropUndefinedObject
   *  @description Recursively removes any undefined properties in an object
   *
   *  @param {object} obj - The object to operate on
   *  @returns {object} The object `obj` without undefined properties
   */
  dropUndefinedObject: obj => {
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key] === 'object') utils.dropUndefinedObject(obj[key]);
      else if (obj[key] === undefined) delete obj[key];
    });
    return obj;
  },

  /** @function filterUndefinedAndEmptyArray
   *  @description Returns a new object where null/undefined, and null/empty arrays are dropped
   *
   *  @param {object} obj A JSON Object
   *  @returns {object} A JSON Object without null/empty arrays and null/undefined properties
   */
  filterUndefinedAndEmptyArray: obj => {
    const ret = {};
    Object.keys(obj)
      .filter((key) => obj[key] !== undefined && obj[key] && obj[key].length)
      .forEach((key) => ret[key] = obj[key]);
    return ret;
  },

  /**
   * @function getGitRevision
   * Gets the current git revision hash
   * @see {@link https://stackoverflow.com/a/34518749}
   * @returns {string} The git revision hash, or empty string
   */
  getGitRevision() {
    try {
      const gitDir = (() => {
        let dir = '.git', i = 0;
        while (!existsSync(join(__dirname, dir)) && i < 5) {
          dir = '../' + dir;
          i++;
        }
        return dir;
      })();

      const head = readFileSync(join(__dirname, `${gitDir}/HEAD`)).toString().trim();
      return (head.indexOf(':') === -1)
        ? head
        : readFileSync(join(__dirname, `${gitDir}/${head.substring(5)}`)).toString().trim();
    } catch (err) {
      log.warn(err.message, { function: 'getGitRevision' });
      return '';
    }
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
