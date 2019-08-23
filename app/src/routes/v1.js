const router = require('express').Router();
const path = require('path');

const checksRouter = require('./v1/checks');
const emailRouter = require('./v1/email');

// Base v1 Responder
router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      '/checks',
      '/email'
    ]
  });
});

// OpenAPI Docs
router.get('/docs', (_req, res) => {
  const docs = require('../docs/docs');
  res.send(docs.getDocHTML('v1'));
});

// OpenAPI YAML Spec
router.get('/api-spec.yaml', (_req, res) => {
  res.sendFile(path.join(__dirname, '../docs/v1.api-spec.yaml'));
});

// Checks
router.use('/checks', checksRouter);

// Email
router.use('/email', emailRouter);

module.exports = router;
