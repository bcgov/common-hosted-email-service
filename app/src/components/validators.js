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

const validators = {

  attachment: {
    content: value => {
      return validatorUtils.isString(value) && !validator.isEmpty(value, {ignore_whitespace: true});
    },

    contentType: value => {
      if (value) {
        return validatorUtils.isString(value) && !validator.isEmpty(value, {ignore_whitespace: true});
      }
      return true;
    },

    encoding: value => {
      if (value) {
        return validatorUtils.isString(value) && !validator.isEmpty(value, {ignore_whitespace: true}) && validator.isIn(value, ['base64','binary','hex']);
      }
      return true;
    },

    filename: value => {
      return validatorUtils.isString(value) && !validator.isEmpty(value, {ignore_whitespace: true});
    },

    size: async (content, encoding, limit = DEFAULT_ATTACHMENT_SIZE) => {
      if (!(validators.attachment.content(content) && validators.attachment.encoding(encoding))) {
        return false;
      }

      let attachmentLimit = bytes.parse(limit);
      if (!attachmentLimit || isNaN(attachmentLimit)|| attachmentLimit < 1) {
        return false;
      }

      // ok, looks like all incoming parameters are ok, check the size
      // write out temp file, if size is ok then return true...
      let tmpFile = undefined;

      try {
        tmpFile = tmp.fileSync();
        await fs.promises.writeFile(tmpFile.name, new Buffer(content, encoding));
        // get the written file size
        const stats = fs.statSync(tmpFile.name);
        return stats.size <= attachmentLimit;
      } catch(e) {
        // something wrong (disk i/o?), cannot verify file size
        log.error(`Error validating file size. ${e.message}`);
        return false;
      } finally {
        // delete tmp file
        if (tmpFile) tmpFile.removeCallback();
      }

    }
  },

  attachments: async (obj, attachmentSizeLimit = DEFAULT_ATTACHMENT_SIZE) => {
    const errors = [];
    if (obj.attachments) {
      if (!Array.isArray(obj.attachments)) {
        errors.push({value: undefined, message: 'Invalid value `attachments`. Expect an array of attachments.'});
      } else {
        // eslint-disable-next-line no-unused-vars
        await asyncForEach(obj.attachments, async (a,i,r) => {
          let validateSize = true;
          if(!validators.attachment.filename(a['filename'])) {
            errors.push({value: a['filename'], message: `Attachments[${i}] invalid value \`filename\`.`});
            validateSize = false;
          }
          if(!validators.attachment.encoding(a['encoding'])) {
            errors.push({value: a['encoding'], message: `Attachments[${i}] invalid value \`encoding\`.`});
            validateSize = false;
          }
          if(!validators.attachment.contentType(a['contentType'])) {
            errors.push({value: a['contentType'], message: `Attachments[${i}] invalid value \`contentType\`.`});
            validateSize = false;
          }
          if(!validators.attachment.content(a['content'])) {
            errors.push({value: 'Attachment purposefully omitted', message: `Attachments[${i}] invalid value \`content\`.`});
            validateSize = false;
          }
          if (validateSize) {
            const validSize = await validators.attachment.size(a.content, a.encoding, attachmentSizeLimit);
            if(!validSize) {
              errors.push({value: 'Attachment purposefully omitted', message: `Attachments[${i}] exceeds size limit of ${bytes.format(attachmentSizeLimit, 'MB')}.`});
            }
          }
        });
      }
    }
    return errors;
  },

  context: {
    bcc: value => {
      return validators.message.bcc(value);
    },

    cc: value => {
      return validators.message.cc(value);
    },

    keys: obj => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return false;
      }
      // only pass an object if all keys in the object or child objects pass...
      let result = Object.keys(obj).every(k => {
        if (obj[k] === Object(obj[k]))  {
          return validators.context.keys(obj[k]);
        }
        // only pass alphanumeric or underscore keys, fail anything else.
        return (/^\w+$/.test(k));
      });
      return result;
    },

    tag: value => {
      return validators.message.tag(value);
    },

    to: value => {
      return validators.message.to(value);
    }
  },

  contexts: (obj) => {
    const errors = [];
    if (obj.contexts) {
      if (!Array.isArray(obj.contexts)) {
        errors.push({value: undefined, message: 'Invalid value `contexts`. Expect an array of contexts.'});
      } else {
        obj.contexts.forEach((c,i) => {
          if(!validators.context.to(c['to'])) {
            errors.push({value: c['to'], message: `Contexts[${i}] invalid value \`to\`.`});
          }
          if(!validators.context.cc(c['cc'])) {
            errors.push({value: c['cc'], message: `Contexts[${i}] invalid value \`cc\`.`});
          }
          if(!validators.context.bcc(c['bcc'])) {
            errors.push({value: c['bcc'], message: `Contexts[${i}] invalid value \`bcc\`.`});
          }
          if(!validators.context.tag(c['tag'])) {
            errors.push({value: c['tag'], message: `Contexts[${i}] invalid value \`tag\`.`});
          }
          if (!c['context']) {
            // let's just return a separate error when context is not passed in...
            errors.push({value: c['context'], message: `Contexts[${i}] invalid value \`context\`.`});
          } else if(!validators.context.keys(c['context'])) {
            // and here we can just show error on improperly named keys.
            errors.push({value: c['context'], message: `Contexts[${i}] \`context\` has invalid keys/fields, only alphanumeric and underscore identifiers allowed.`});
          }
        });
      }
    } else {
      errors.push({value: undefined, message: 'Invalid value `contexts`. Contexts array not provided.'});
    }
    return errors;
  },

  email: async (email, attachmentSizeLimit = DEFAULT_ATTACHMENT_SIZE) => {
    // validate the email object
    // completely valid object will return an empty array of errors.
    // an invalid object will return a populated array of errors.
    const errors = [];

    if (!validators.message.from(email['from'])) {
      errors.push({value: email['from'], message: 'Invalid value `from`.'});
    }
    if (!validators.message.to(email['to'])) {
      errors.push({value: email['to'], message: 'Invalid value `to`.'});
    }
    if (!validators.message.cc(email['cc'])) {
      errors.push({value: email['cc'], message: 'Invalid value `cc`.'});
    }
    if (!validators.message.bcc(email['bcc'])) {
      errors.push({value: email['bcc'], message: 'Invalid value `bcc`.'});
    }
    if (!validators.message.subject(email['subject'])) {
      errors.push({value: email['subject'], message: 'Invalid value `subject`.'});
    }
    if (!validators.message.bodyType(email['bodyType'])) {
      errors.push({value: email['bodyType'], message: 'Invalid value `bodyType`.'});
    }
    if (!validators.message.body(email['body'])) {
      errors.push({value: 'Body purposefully omitted', message: 'Invalid value `body`.'});
    }
    if (!validators.message.encoding(email['encoding'])) {
      errors.push({value: email['encoding'], message: 'Invalid value `encoding`.'});
    }
    if (!validators.message.priority(email['priority'])) {
      errors.push({value: email['priority'], message: 'Invalid value `priority`.'});
    }
    if (!validators.message.priority(email['tag'])) {
      errors.push({value: email['tag'], message: 'Invalid value `tag`.'});
    }
    const attachmentErrors = await validators.attachments(email, attachmentSizeLimit);
    if (attachmentErrors) {
      attachmentErrors.forEach(x => errors.push(x));
    }

    return errors;
  },

  merge: async(merge, attachmentSizeLimit = DEFAULT_ATTACHMENT_SIZE) => {
    // validate the merge object
    // completely valid object will return an empty array of errors.
    // an invalid object will return a populated array of errors.
    const errors = [];
    if (!validators.message.from(merge['from'])) {
      errors.push({value: merge['from'], message: 'Invalid value `from`.'});
    }
    if (!validators.message.subject(merge['subject'])) {
      errors.push({value: merge['subject'], message: 'Invalid value `subject`.'});
    }
    if (!validators.message.bodyType(merge['bodyType'])) {
      errors.push({value: merge['bodyType'], message: 'Invalid value `bodyType`.'});
    }
    if (!validators.message.body(merge['body'])) {
      errors.push({value: 'Body purposefully omitted', message: 'Invalid value `body`.'});
    }
    if (!validators.message.encoding(merge['encoding'])) {
      errors.push({value: merge['encoding'], message: 'Invalid value `encoding`.'});
    }
    if (!validators.message.priority(merge['priority'])) {
      errors.push({value: merge['priority'], message: 'Invalid value `priority`.'});
    }

    const contextErrors = validators.contexts(merge);
    if (contextErrors) {
      contextErrors.forEach(x => errors.push(x));
    }

    const attachmentErrors = await validators.attachments(merge, attachmentSizeLimit);
    if (attachmentErrors) {
      attachmentErrors.forEach(x => errors.push(x));
    }

    return errors;
  },

  message: {

    bcc: value => {
      if (value) {
        return validatorUtils.isEmailList(value);
      }
      return true;
    },

    body: value => {
      return validatorUtils.isString(value) && !validator.isEmpty(value, {ignore_whitespace: true});
    },

    bodyType: value => {
      return validatorUtils.isString(value) && !validator.isEmpty(value, {ignore_whitespace: true}) && validator.isIn(value, ['html','text']);
    },

    cc: value => {
      if (value) {
        return validatorUtils.isEmailList(value);
      }
      return true;
    },

    encoding: value => {
      if (value) {
        return validatorUtils.isString(value) && !validator.isEmpty(value, {ignore_whitespace: true}) && validator.isIn(value, ['base64','binary','hex','utf-8']);
      }
      return true;
    },

    from: value => {
      return validatorUtils.isEmail(value);
    },

    priority: value => {
      if (value) {
        return validatorUtils.isString(value) && validator.isIn(value, ['normal','low', 'high']);
      }
      return true;
    },

    subject: value => {
      return validatorUtils.isString(value) && !validator.isEmpty(value, {ignore_whitespace: true});
    },

    tag: value => {
      if (value) {
        return validatorUtils.isString(value) && !validator.isEmpty(value, {ignore_whitespace: true});
      }
      return true;
    },

    to: value => {
      return validatorUtils.isEmailList(value) && value.length > 0;
    }

  }

};

const validatorUtils = {
  isString: x => {
    return Object.prototype.toString.call(x) === '[object String]';
  },

  isEmail: x => {
    return validatorUtils.isString(x) && !validator.isEmpty(x, {ignore_whitespace: true}) && validator.isEmail(x, {allow_display_name: true});
  },

  isEmailList: x => {
    return x && Array.isArray(x) && x.every(v => { return validatorUtils.isEmail(v); });
  }

};

module.exports = { validators, validatorUtils };
