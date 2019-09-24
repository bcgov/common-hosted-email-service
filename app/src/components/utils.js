const bytes = require('bytes');
const validator = require('validator');

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
   *  @param {string} str A string
   *  @returns {string} A string formatted in Pascal Case
   */
  toPascalCase: str => str.toLowerCase().replace(/\b\w/g, t => t.toUpperCase()),

  /** Returns a true if the contexts pass validation, otherwise throws an exception with the validation error
   *  @param {array} contexts The array of contexts from a mail merge request
   *  @returns {boolean} true if all good
   *  @throws Reason the `contexts` object is invalid
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
      if (obj[k] === Object(obj[k])) {
        return utils.validateKeys(obj[k]);
      }
      if (!/^\w+$/.test(k)) throw new Error(`Invalid field name (${k}) in \`context\`.  Only alphanumeric characters and underscore allowed.`);
    });
    return true;
  },

  /** Inspects an array of attachments for validity, otherwise throws an exception with the validation error
   * @param {object[]} attachments An array of attachment items
   * @param {string} attachmentLimit The upper bound filesize an attachment should be
   * @throws Reason the Attachment is invalid
   */
  validateAttachments: (attachments, attachmentLimit = '5mb') => {
    if (attachments) {
      if (!Array.isArray(attachments)) {
        throw new Error('Invalid value `attachments`');
      } else {
        attachments.every(item => {
          try {
            if (item.filename === undefined ||
              item.encoding === undefined ||
              item.content === undefined) throw new Error('Attachment is malformed.  Expect filename, encoding, and content fields.');
            if (validator.isEmpty(item.filename)) throw new Error('Attachment `filename` is required');
            if (validator.isEmpty(item.content)) throw new Error('Attachment `content` is required');
            if (!['base64', 'binary', 'hex'].includes(item.encoding)) throw new Error('Invalid value `encoding` for attachment');
            //content
            // want to ensure this fits within our expected size limits...
            // add a little fudge factor here for encoding, otherwise we need to actually write the file out and examine size on disk.
            const allowedBytes = bytes.parse(attachmentLimit);
            const acceptableBytes = allowedBytes * 1.05;
            const attachmentLength = Buffer.byteLength(item.content, item.encoding);
            if (attachmentLength > acceptableBytes) {
              throw new Error(`Attachment size (${bytes.format(attachmentLength, 'mb')}) exceeds limit of ${bytes.format(allowedBytes, 'mb')}.`);
            }
          } catch (e) {
            if (item.content && !validator.isLength(item.content, {
              min: 0,
              max: 1024
            })) {
              item.content = 'Actual Content removed for brevity.';
            }
            throw e;
          }
          return;
        });
      }
    }
    return true; // not mandatory, so ok if doesn't exist.
  },

  /** A blocking sleep/wait function
   *  https://stackoverflow.com/a/39914235
   *  @param {integer} ms Number of milliseconds to wait
   *  @returns A promise after `ms` milliseconds
   */
  wait: ms => new Promise(r => setTimeout(r, ms))
};

module.exports = utils;
