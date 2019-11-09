const config = require('config');
const Problem = require('api-problem');
const { validators } = require('../components/validators');

const handleValidationErrors = (res, next, errors) => {
  if (errors && errors.length) {
    return new Problem(422, {
      detail: 'Validation failed',
      errors: errors
    }).send(res);
  }

  next();
};

const validateCancelMsg = (req, res, next) => {
  const errors = validators.cancelMsg(req.params);
  handleValidationErrors(res, next, errors);
};

const validateEmail = async (req, res, next) => {
  const errors = await validators.email(req.body, config.get('server.attachmentLimit'));
  handleValidationErrors(res, next, errors);
};

const validateMerge = async (req, res, next) => {
  const errors = await validators.merge(req.body, config.get('server.attachmentLimit'));
  handleValidationErrors(res, next, errors);

};

const validateStatusFetch = (req, res, next) => {
  const errors = validators.statusFetch(req.params);
  handleValidationErrors(res, next, errors);
};

const validateStatusQuery = (req, res, next) => {
  const errors = validators.statusQuery(req.query);
  handleValidationErrors(res, next, errors);
};

module.exports = {
  validateCancelMsg,
  validateEmail,
  validateMerge,
  validateStatusFetch,
  validateStatusQuery
};
