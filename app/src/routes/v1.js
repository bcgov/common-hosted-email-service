const router = require('express').Router();

const keycloak = require('../components/keycloak');
const { authorizedPartyValidator } = require('../middleware/authorizedParty');

const {
  cancelRouter,
  docsRouter,
  emailRouter,
  healthRouter,
  mergeRouter,
  promoteRouter,
  statusRouter
} = require('./v1/');

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

/** Documentation Router */
router.use('/docs', docsRouter);

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
