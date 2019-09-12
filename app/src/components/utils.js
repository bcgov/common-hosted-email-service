const utils = {
  /** Returns a new object where undefined and empty arrays are dropped
   *  @param {object} obj A JSON Object
   *  @returns {object} A JSON Object without empty arrays and undefined properties
   */
  filterUndefinedAndEmpty: obj => {
    const ret = {};
    Object.keys(obj)
      .filter((key) => obj[key] !== undefined && obj[key].length)
      .forEach((key) => ret[key] = obj[key]);
    return ret;
  },

  /** Returns a pretty JSON representation of an object
   *  @param {object} obj A JSON Object
   *  @param {integer} indent Number of spaces to indent
   *  @returns {string} A pretty printed string representation of `obj` with `indent` indentation
   */
  prettyStringify: (obj, indent = 2) => JSON.stringify(obj, null, indent),

  /** Returns a string in Pascal Case
   * @param {string} str A string
   * @returns {string} A string formatted in Pascal Case
   */
  toPascalCase: str => str.toLowerCase().replace(/\b\w/g, t => t.toUpperCase()),

  /** Returns a true if the contexts pass validation, otherwise throws an exception with the validation error
   * @param {array} contexts The array of contexts from a mail merge request
   * @returns {boolean} true if all good
   * @throws Reason the `contexts` object is invalid
   */
  validateContexts: contexts => {
    return contexts.every(entry => {
      if (!Array.isArray(entry.to)) throw new Error('Invalid value `to`');
      if (entry.bcc && !Array.isArray(entry.bcc)) throw new Error('Invalid value `bcc`');
      if (entry.cc && !Array.isArray(entry.cc)) throw new Error('Invalid value `cc`');
      if (typeof entry.context !== 'object') throw new Error('Invalid value `context`');
      utils.validateKeys(entry.context);
      return true;
    });
  },

  /** Returns a true if the object's keys pass validation, otherwise throws an exception with the validation error
   * @param {object} obj a Javascript object
   * @returns {boolean} true if all good
   * @throws Reason the `key` object is invalid
   */
  validateKeys: obj => {
    Object.keys(obj).forEach(k => {
      if (obj[k] === Object(obj[k]))  {
        return utils.validateKeys(obj[k]);
      }
      if (!/^\w+$/.test(k)) throw new Error(`Invalid field name (${k}) in \`context\`.  Only alphanumeric characters and underscore allowed.`);
    });
    return true;
  }
};

module.exports = utils;
