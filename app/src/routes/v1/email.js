const emailRouter = require('express').Router();
const Problem = require('api-problem');
const {
  body,
  validationResult
} = require('express-validator');

const emailComponent = require('../../components/email');
const utils = require('../../components/utils');

/** Email sending endpoint */
emailRouter.post('/', [
  body('bodyType').isIn(['html', 'text']),
  body('body').isString(),
  body('from').isString(),
  body('to').isArray(),
  body('subject').isString()
], async (req, res, next) => {
  // Validate for Bad Requests
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return new Problem(400, {
      detail: 'Validation failed',
      errors: errors.array()
    }).send(res);
  }

  try {
    if (req.query.devMode) {
      const result = await emailComponent.sendMailEthereal(req.body);
      res.status(201).json(result);
    } else {
      const result = await emailComponent.sendMailSmtp(req.body);
      res.status(201).json(result);
    }
  } catch (error) {
    next(error);
  }
});

/** Template mail merge & email sending endpoint */
emailRouter.post('/merge', [
  body('bodyType').isIn(['html', 'text']),
  body('body').isString(),
  body('contexts').isArray().custom(validateContexts),
  body('from').isString(),
  body('subject').isString()
], async (req, res, next) => {
  // Validate for Bad Requests
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return new Problem(400, {
      detail: 'Validation failed',
      errors: errors.array()
    }).send(res);
  }

  try {
    if (req.query.devMode) {
      const result = await emailComponent.mergeMailEthereal(req.body);
      res.status(201).json(result);
    } else {
      const result = await emailComponent.mergeMailSmtp(req.body);
      res.status(201).json(result);
    }
  } catch (error) {
    next(error);
  }
});

/** Template mail merge validation & preview endpoint */
emailRouter.post('/merge/preview', [
  body('bodyType').isIn(['html', 'text']),
  body('body').isString(),
  body('contexts').isArray().custom(validateContexts),
  body('from').isString(),
  body('subject').isString()
], (req, res, next) => {
  // Validate for Bad Requests
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return new Problem(400, {
      detail: 'Validation failed',
      errors: errors.array()
    }).send(res);
  }

  try {
    const result = emailComponent.mergeTemplate(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/** Returns the structural validity of the contexts object
 *  @param {object} contexts A contexts object
 *  @returns {boolean} True if valid, otherwise false
 *  @throws Reason the `contexts` object is invalid
 */
function validateContexts(contexts) {
  return utils.validateContexts(contexts);
}

module.exports = emailRouter;
