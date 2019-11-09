const bytes = require('bytes');
const fs = require('fs');
const log = require('npmlog');
const tmp = require('tmp');
const validator = require('validator');

const DEFAULT_ATTACHMENT_SIZE = bytes.parse('5mb');

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};

const models = {
  attachment: {
    /** @function content */
    content: value => {
      return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true });
    },

    /** @function contentType */
    contentType: value => {
      if (value) {
        return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true });
      }
      return true;
    },

    /** @function encoding */
    encoding: value => {
      if (value) {
        return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true }) && validator.isIn(value, ['base64', 'binary', 'hex']);
      }
      return true;
    },

    /** @function filename */
    filename: value => {
      return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true });
    },

    /** @function size */
    size: async (content, encoding, limit = DEFAULT_ATTACHMENT_SIZE) => {
      if (!(models.attachment.content(content) && models.attachment.encoding(encoding))) {
        return false;
      }

      let attachmentLimit = bytes.parse(limit);
      if (!attachmentLimit || isNaN(attachmentLimit) || attachmentLimit < 1) {
        return false;
      }

      // ok, looks like all incoming parameters are ok, check the size
      // write out temp file, if size is ok then return true...
      let tmpFile = undefined;

      try {
        tmpFile = tmp.fileSync();
        await fs.promises.writeFile(tmpFile.name, Buffer.from(content, encoding));
        // get the written file size
        const stats = fs.statSync(tmpFile.name);
        return stats.size <= attachmentLimit;
      } catch (e) {
        // something wrong (disk i/o?), cannot verify file size
        log.error(`Error validating file size. ${e.message}`);
        return false;
      } finally {
        // delete tmp file
        if (tmpFile) tmpFile.removeCallback();
      }
    }
  },

  context: {
    /** @function bcc */
    bcc: value => {
      return models.message.bcc(value);
    },

    /** @function cc */
    cc: value => {
      return models.message.cc(value);
    },

    /** @function delayTS */
    delayTS: value => {
      return models.message.delayTS(value);
    },

    /** @function keys */
    keys: obj => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return false;
      }
      // only pass an object if all keys in the object or child objects pass...
      let result = Object.keys(obj).every(k => {
        if (!Array.isArray(obj[k]) && obj[k] === Object(obj[k])) {
          return models.context.keys(obj[k]);
        }
        // only pass alphanumeric or underscore keys, fail anything else.
        return (/^\w+$/.test(k));
      });
      return result;
    },

    /** @function tag */
    tag: value => {
      return models.message.tag(value);
    },

    /** @function to */
    to: value => {
      return models.message.to(value);
    }
  },

  message: {
    /** @function bcc */
    bcc: value => {
      if (value) {
        return validatorUtils.isEmailList(value);
      }
      return true;
    },

    /** @function body */
    body: value => {
      return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true });
    },

    /** @function bodyType */
    bodyType: value => {
      return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true }) && validator.isIn(value, ['html', 'text']);
    },

    /** @function cc */
    cc: value => {
      if (value) {
        return validatorUtils.isEmailList(value);
      }
      return true;
    },

    /** @function delayTS */
    delayTS: value => {
      if (value) {
        return validatorUtils.isInt(value);
      }
      return true;
    },

    /** @function encoding */
    encoding: value => {
      if (value) {
        return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true }) && validator.isIn(value, ['base64', 'binary', 'hex', 'utf-8']);
      }
      return true;
    },

    /** @function from */
    from: value => {
      return validatorUtils.isEmail(value);
    },

    /** @function priority */
    priority: value => {
      if (value) {
        return validatorUtils.isString(value) && validator.isIn(value, ['normal', 'low', 'high']);
      }
      return true;
    },

    /** @function subject */
    subject: value => {
      return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true });
    },

    /** @function tag */
    tag: value => {
      if (value) {
        return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true });
      }
      return true;
    },

    /** @function to */
    to: value => {
      return validatorUtils.isEmailList(value) && value.length > 0;
    }
  },

  queryParams: {
    /** @function msgId */
    msgId: value => {
      if (value) {
        return validatorUtils.isString(value) && validator.isUUID(value);
      }
      return true;
    },

    /** @function status */
    // TODO: Change this to enforce an enumeration of valid states
    status: value => {
      if (value) {
        return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true });
      }
      return true;
    },

    /** @function tag */
    tag: value => {
      if (value) {
        return validatorUtils.isString(value) && !validator.isEmpty(value, { ignore_whitespace: true });
      }
      return true;
    },

    /** @function txId */
    txId: value => {
      if (value) {
        return validatorUtils.isString(value) && validator.isUUID(value);
      }
      return true;
    }
  }
};

const validators = {
  attachments: async (obj, attachmentSizeLimit = DEFAULT_ATTACHMENT_SIZE) => {
    const errors = [];
    if (obj.attachments) {
      if (!Array.isArray(obj.attachments)) {
        errors.push({ value: undefined, message: 'Invalid value `attachments`. Expect an array of attachments.' });
      } else {
        // eslint-disable-next-line no-unused-vars
        await asyncForEach(obj.attachments, async (a, i, r) => {
          let validateSize = true;
          if (!models.attachment.filename(a['filename'])) {
            errors.push({ value: a['filename'], message: `Attachments[${i}] invalid value \`filename\`.` });
            validateSize = false;
          }
          if (!models.attachment.encoding(a['encoding'])) {
            errors.push({ value: a['encoding'], message: `Attachments[${i}] invalid value \`encoding\`.` });
            validateSize = false;
          }
          if (!models.attachment.contentType(a['contentType'])) {
            errors.push({ value: a['contentType'], message: `Attachments[${i}] invalid value \`contentType\`.` });
            validateSize = false;
          }
          if (!models.attachment.content(a['content'])) {
            errors.push({
              value: 'Attachment purposefully omitted',
              message: `Attachments[${i}] invalid value \`content\`.`
            });
            validateSize = false;
          }
          if (validateSize) {
            const validSize = await models.attachment.size(a.content, a.encoding, attachmentSizeLimit);
            if (!validSize) {
              errors.push({
                value: 'Attachment purposefully omitted',
                message: `Attachments[${i}] exceeds size limit of ${bytes.format(attachmentSizeLimit, 'MB')}.`
              });
            }
          }
        });
      }
    }
    return errors;
  },

  cancelMsg: param => {
    const errors = [];

    if(!param.msgId) {
      errors.push({ value: param.msgId, message: 'Missing value `msgId`.' });
    } else if (!models.queryParams.msgId(param.msgId)) {
      errors.push({ value: param.msgId, message: 'Invalid value `msgId`.' });
    }

    return errors;
  },

  contexts: obj => {
    const errors = [];
    if (obj.contexts) {
      if (!Array.isArray(obj.contexts)) {
        errors.push({ value: undefined, message: 'Invalid value `contexts`. Expect an array of contexts.' });
      } else {
        obj.contexts.forEach((c, i) => {
          if (!models.context.to(c['to'])) {
            errors.push({ value: c['to'], message: `Contexts[${i}] invalid value \`to\`.` });
          }
          if (!models.context.cc(c['cc'])) {
            errors.push({ value: c['cc'], message: `Contexts[${i}] invalid value \`cc\`.` });
          }
          if (!models.context.bcc(c['bcc'])) {
            errors.push({ value: c['bcc'], message: `Contexts[${i}] invalid value \`bcc\`.` });
          }
          if (!models.context.tag(c['tag'])) {
            errors.push({ value: c['tag'], message: `Contexts[${i}] invalid value \`tag\`.` });
          }
          if (!models.context.delayTS(c['delayTS'])) {
            errors.push({ value: c['delayTS'], message: `Contexts[${i}] invalid value \`delayTS\`.` });
          }
          if (!c['context']) {
            // let's just return a separate error when context is not passed in...
            errors.push({ value: c['context'], message: `Contexts[${i}] invalid value \`context\`.` });
          } else if (!models.context.keys(c['context'])) {
            // and here we can just show error on improperly named keys.
            errors.push({
              value: c['context'],
              message: `Contexts[${i}] \`context\` is invalid. Names can only contain alphanumeric or underscore characters.`
            });
          }
        });
      }
    } else {
      errors.push({ value: undefined, message: 'Invalid value `contexts`. Contexts array not provided.' });
    }
    return errors;
  },

  email: async (obj, attachmentSizeLimit = DEFAULT_ATTACHMENT_SIZE) => {
    // validate the email object
    // completely valid object will return an empty array of errors.
    // an invalid object will return a populated array of errors.
    const errors = [];

    validators.messageFields(obj, errors);

    if (!models.message.to(obj['to'])) {
      errors.push({ value: obj['to'], message: 'Invalid value `to`.' });
    }
    if (!models.message.cc(obj['cc'])) {
      errors.push({ value: obj['cc'], message: 'Invalid value `cc`.' });
    }
    if (!models.message.bcc(obj['bcc'])) {
      errors.push({ value: obj['bcc'], message: 'Invalid value `bcc`.' });
    }
    if (!models.message.tag(obj['tag'])) {
      errors.push({ value: obj['tag'], message: 'Invalid value `tag`.' });
    }
    if (!models.message.delayTS(obj['delayTS'])) {
      errors.push({ value: obj['delayTS'], message: 'Invalid value `delayTS`.' });
    }
    const attachmentErrors = await validators.attachments(obj, attachmentSizeLimit);
    if (attachmentErrors) {
      attachmentErrors.forEach(x => errors.push(x));
    }

    return errors;
  },

  messageFields: (obj, errors) => {
    if (!models.message.from(obj['from'])) {
      errors.push({ value: obj['from'], message: 'Invalid value `from`.' });
    }
    if (!models.message.subject(obj['subject'])) {
      errors.push({ value: obj['subject'], message: 'Invalid value `subject`.' });
    }
    if (!models.message.bodyType(obj['bodyType'])) {
      errors.push({ value: obj['bodyType'], message: 'Invalid value `bodyType`.' });
    }
    if (!models.message.body(obj['body'])) {
      errors.push({ value: 'Body purposefully omitted', message: 'Invalid value `body`.' });
    }
    if (!models.message.encoding(obj['encoding'])) {
      errors.push({ value: obj['encoding'], message: 'Invalid value `encoding`.' });
    }
    if (!models.message.priority(obj['priority'])) {
      errors.push({ value: obj['priority'], message: 'Invalid value `priority`.' });
    }
  },

  merge: async (merge, attachmentSizeLimit = DEFAULT_ATTACHMENT_SIZE) => {
    // validate the merge object
    // completely valid object will return an empty array of errors.
    // an invalid object will return a populated array of errors.
    const errors = [];
    validators.messageFields(merge, errors);

    validators.contexts(merge).forEach(x => errors.push(x));

    const attachmentErrors = await validators.attachments(merge, attachmentSizeLimit);
    if (attachmentErrors) {
      attachmentErrors.forEach(x => errors.push(x));
    }

    return errors;
  },

  statusFetch: param => {
    const errors = [];

    if (!models.queryParams.msgId(param.msgId)) {
      errors.push({ value: param.msgId, message: 'Invalid value `msgId`.' });
    }

    return errors;
  },

  statusQuery: query => {
    const errors = [];

    if (!query || !Object.keys(query).some(param => validator.isIn(param, ['msgId', 'status', 'tag', 'txId']))) {
      errors.push({
        value: 'params',
        message: 'At least one of `msgId`, `status`, `tag` or `txId` must be defined.'
      });
    }

    validators.searchQueryFields(query).forEach(error => errors.push(error));

    if (query && query.fields) {
      query.fields.split(',').forEach(field => {
        if (!validator.isIn(field, ['createdTimestamp', 'delayTS', 'updatedTimestamp'])) {
          errors.push({
            value: 'fields',
            message: `Value \`${field}\` is not one of \`createdTimestamp\`, \`delayTS\`, or \`updatedTimestamp\`.`
          });
        }
      });
    }

    return errors;
  },

  searchQueryFields: obj => {
    const errors = [];

    if (!models.queryParams.msgId(obj.msgId)) {
      errors.push({ value: obj.msgId, message: 'Invalid value `msgId`.' });
    }
    if (!models.queryParams.status(obj.status)) {
      errors.push({ value: obj.status, message: 'Invalid value `status`.' });
    }
    if (!models.queryParams.tag(obj.tag)) {
      errors.push({ value: obj.tag, message: 'Invalid value `tag`.' });
    }
    if (!models.queryParams.txId(obj.txId)) {
      errors.push({ value: obj.txId, message: 'Invalid value `txId`.' });
    }

    return errors;
  }
};

const validatorUtils = {
  /** @function isEmail */
  isEmail: x => {
    return validatorUtils.isString(x) && !validator.isEmpty(x, { ignore_whitespace: true }) && validator.isEmail(x, { allow_display_name: true });
  },

  /** @function isEmailList */
  isEmailList: x => {
    return x && Array.isArray(x) && x.every(v => {
      return validatorUtils.isEmail(v);
    });
  },

  /** @function isInt */
  isInt: x => {
    if (isNaN(x)) {
      return false;
    }
    const num = parseFloat(x);
    // use modulus to determine if it is an int
    return num % 1 === 0;
  },

  /** @function isString */
  isString: x => {
    return Object.prototype.toString.call(x) === '[object String]';
  }
};

module.exports = { models, validators, validatorUtils };
