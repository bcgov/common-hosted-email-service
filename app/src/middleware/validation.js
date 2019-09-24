const config = require('config');
const Problem = require('api-problem');
const { validators }= require('../components/validators');

const validateEmail = async (req, res, next) => {
  const errors = await validators.email(req.body, config.get('server.attachmentLimit'));
  if (errors.length > 0) {
    return new Problem(422, {
      detail: 'Validation failed',
      errors: errors
    }).send(res);
  }
  next();
};

const validateMerge = async (req, res, next) => {
  const errors = await validators.merge(req.body, config.get('server.attachmentLimit'));
  if (errors.length > 0) {
    return new Problem(422, {
      detail: 'Validation failed',
      errors: errors
    }).send(res);
  }
  next();
};

module.exports = {validateEmail, validateMerge};
