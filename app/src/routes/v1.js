const config = require('config');
const fs = require('fs');
const router = require('express').Router();
const path = require('path');
const yaml = require('js-yaml');

const keycloak = require('../components/keycloak');
const { authorizedPartyValidator } = require('../middleware/authorizedParty');

const {
  cancelRouter,
  emailRouter,
  healthRouter,
  mergeRouter,
  promoteRouter,
  statusRouter
} = require('./v1/');

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
      '/api-spec.json',
      '/api-spec.yaml',
      '/cancel',
      '/docs',
      '/email',
      '/emailMerge',
      '/health',
      '/promote',
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
router.use('/email', keycloak.protect(), authorizedPartyValidator, emailRouter);

/** Merge Router */
router.use('/emailMerge', keycloak.protect(), authorizedPartyValidator, mergeRouter);

/** Status Router */
router.use('/status', keycloak.protect(), authorizedPartyValidator, statusRouter);

/** Cancel Router */
router.use('/cancel', keycloak.protect(), authorizedPartyValidator, cancelRouter);

/** Promote Router */
router.use('/promote', keycloak.protect(), authorizedPartyValidator, promoteRouter);

module.exports = router;
