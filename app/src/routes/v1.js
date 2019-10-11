const config = require('config');
const router = require('express').Router();
const path = require('path');

const keycloak = require('../components/keycloak');
const authorizedParty = require('../middleware/authorizedParty');

const emailRouter = require('./v1/email');
const healthRouter = require('./v1/health');
const mergeRouter = require('./v1/merge');
const statusRouter = require('./v1/status');

const clientId = config.get('keycloak.clientId');

/** Base v1 Responder */
router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      '/checks',
      '/email'
    ]
  });
});

/** OpenAPI Docs */
router.get('/docs', (_req, res) => {
  const docs = require('../docs/docs');
  res.send(docs.getDocHTML('v1'));
});

/** OpenAPI YAML Spec */
router.get('/api-spec.yaml', (_req, res) => {
  res.sendFile(path.join(__dirname, '../docs/v1.api-spec.yaml'));
});

/** Health Router */
router.use('/checks', keycloak.protect(), healthRouter);

/** Email Router */
router.use('/email', keycloak.protect(`${clientId}:EMAILER`), authorizedParty, emailRouter);

/** Merge Router */
router.use('/emailMerge', keycloak.protect(`${clientId}:EMAILER`), authorizedParty, mergeRouter);

/** Status Router */
router.use('/status', keycloak.protect(`${clientId}:EMAILER`), authorizedParty, statusRouter);

module.exports = router;
