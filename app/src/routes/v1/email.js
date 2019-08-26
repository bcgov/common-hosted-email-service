const emailRouter = require('express').Router();
const Problem = require('api-problem');
const {
  body,
  validationResult
} = require('express-validator');

const emailComponent = require('../../components/email');

// pushes a message
emailRouter.post('/', [
  body('bodyType').isIn(['html', 'text']),
  body('body').isString(),
  body('from').isString(),
  body('to').isArray(),
  body('subject').isString()
], async (req, res) => {
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
    new Problem(500, {
      detail: error.message
    }).send(res);
  }
});

emailRouter.post('/merge', [
  body('bodyType').isIn(['html', 'text']),
  body('body').isString(),
  body('contexts').isArray(),
  body('from').isString(),
  body('subject').isString()
], async (req, res) => {
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
      const result = await emailComponent.mergeTemplate(req.body);
      res.status(201).json(result);
    } else {
      const result = await emailComponent.mergeTemplate(req.body);
      res.status(201).json(result);
    }
  } catch (error) {
    new Problem(500, {
      detail: error.message
    }).send(res);
  }
});

emailRouter.post('/merge/preview', [
  body('bodyType').isIn(['html', 'text']),
  body('body').isString(),
  body('contexts').isArray(),
  body('from').isString(),
  body('subject').isString()
], async (req, res) => {
  // Validate for Bad Requests
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return new Problem(400, {
      detail: 'Validation failed',
      errors: errors.array()
    }).send(res);
  }

  try {
    const result = await emailComponent.mergeTemplate(req.body);
    res.status(201).json(result);
  } catch (error) {
    new Problem(500, {
      detail: error.message
    }).send(res);
  }
});

module.exports = emailRouter;
