const config = require('config');
const fs = require('fs');
const router = require('express').Router();
const path = require('path');
const yaml = require('js-yaml');

const keycloak = require('../components/keycloak');
const { authorizedPartyValidator } = require('../middleware/authorizedParty');

const cancelRouter = require('./v1/cancel');
const emailRouter = require('./v1/email');
const healthRouter = require('./v1/health');
const mergeRouter = require('./v1/merge');
const statusRouter = require('./v1/status');

const clientId = config.get('keycloak.clientId');

const getSpec = () => {
  const rawSpec = fs.readFileSync(path.join(__dirname, '../docs/v1.api-spec.yaml'), 'utf8');
  const spec = yaml.load(rawSpec);
  spec.components.securitySchemes.OpenID.openIdConnectUrl = `${config.get('keycloak.serverUrl')}/realms/${config.get('keycloak.realm')}/.well-known/openid-configuration`;
  return spec;
};

/** Base v1 Responder */
router.get('/', (_req, res) => {
  res.status(200).json({
    endpoints: [
      '/api-spec.yaml',
      '/cancel',
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
  res.status(200).type('application/yaml').send(yaml.dump(getSpec()));
});

/** OpenAPI JSON Spec */
router.get('/api-spec.json', (_req, res) => {
  res.status(200).json(getSpec());
});

/** Health Router */
router.use('/health', keycloak.protect(), authorizedPartyValidator, healthRouter);

/** Email Router */
router.use('/email', keycloak.protect(`${clientId}:EMAILER`), authorizedPartyValidator, emailRouter);

/** Merge Router */
router.use('/emailMerge', keycloak.protect(`${clientId}:EMAILER`), authorizedPartyValidator, mergeRouter);

/** Status Router */
router.use('/status', keycloak.protect(`${clientId}:EMAILER`), authorizedPartyValidator, statusRouter);

/** Cancel Router */
router.use('/cancel', keycloak.protect(`${clientId}:EMAILER`), authorizedPartyValidator, cancelRouter);

module.exports = router;
