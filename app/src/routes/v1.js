const config = require('config');
const router = require('express').Router();
const path = require('path');

const keycloak = require('../components/keycloak');
const { authorizedPartyValidator } = require('../middleware/authorizedParty');

const emailRouter = require('./v1/email');
const healthRouter = require('./v1/health');
const mergeRouter = require('./v1/merge');
const statusRouter = require('./v1/status');

const clientId = config.get('keycloak.clientId');

/** Base v1 Responder */
router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      '/api-spec.yaml',
      '/docs',
      '/email',
      '/emailMerge',
      '/health',
      '/status'
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
router.use('/health', keycloak.protect(), authorizedPartyValidator, healthRouter);

/** Email Router */
router.use('/email', keycloak.protect(`${clientId}:EMAILER`), authorizedPartyValidator, emailRouter);

/** Merge Router */
router.use('/emailMerge', keycloak.protect(`${clientId}:EMAILER`), authorizedPartyValidator, mergeRouter);

/** Status Router */
router.use('/status', keycloak.protect(`${clientId}:EMAILER`), authorizedPartyValidator, statusRouter);

module.exports = router;
