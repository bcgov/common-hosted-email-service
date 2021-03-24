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

const validation = {
  validateCancelMsg: (req, res, next) => {
    const errors = validators.cancelMsg(req.params);
    handleValidationErrors(res, next, errors);
  },

  validateCancelQuery: (req, res, next) => {
    const errors = validators.cancelQuery(req.query);
    handleValidationErrors(res, next, errors);
  },

  validateDispatchMsg: (req, res, next) => {
    const errors = validators.dispatchMsg(req.params);
    handleValidationErrors(res, next, errors);
  },

  validateEmail: async (req, res, next) => {
    const errors = await validators.email(req.body, config.get('server.attachmentLimit'));
    handleValidationErrors(res, next, errors);
  },

  validateMerge: async (req, res, next) => {
    const errors = await validators.merge(req.body, config.get('server.attachmentLimit'));
    handleValidationErrors(res, next, errors);

  },

  validateStatusFetch: (req, res, next) => {
    const errors = validators.statusFetch(req.params);
    handleValidationErrors(res, next, errors);
  },

  validateStatusQuery: (req, res, next) => {
    const errors = validators.statusQuery(req.query);
    handleValidationErrors(res, next, errors);
  }
};

module.exports = validation;
