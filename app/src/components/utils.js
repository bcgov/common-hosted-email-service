const utils = {
  // Returns a pretty JSON representation of an object
  prettyStringify: (obj, indent = 2) => JSON.stringify(obj, null, indent),

  // Returns a string in Pascal Case
  toPascalCase: str => str.toLowerCase().replace(/\b\w/g, t => t.toUpperCase())
};

module.exports = utils;
