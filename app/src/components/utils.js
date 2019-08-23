const utils = {
  /** Returns a new object where undefined and empty arrays are dropped */
  filterUndefinedAndEmpty: (obj) => {
    const ret = {};
    Object.keys(obj)
      .filter((key) => obj[key] !== undefined && obj[key].length)
      .forEach((key) => ret[key] = obj[key]);
    return ret;
  },

  /** Returns a pretty JSON representation of an object */
  prettyStringify: (obj, indent = 2) => JSON.stringify(obj, null, indent),

  /** Returns a string in Pascal Case */
  toPascalCase: str => str.toLowerCase().replace(/\b\w/g, t => t.toUpperCase())
};

module.exports = utils;
