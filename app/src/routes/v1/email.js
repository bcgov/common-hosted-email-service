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
      res.status(200).end();
    }
  } catch (error) {
    new Problem(502, {
      detail: error.message
    }).send(res);
  }
});

emailRouter.post('/merge', async (_req, res) => {
  new Problem(501).send(res);
});

emailRouter.post('/merge/preview', async (_req, res) => {
  new Problem(501).send(res);
});

module.exports = emailRouter;
