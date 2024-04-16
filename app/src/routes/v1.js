const router = require('express').Router();

const { tokenValidator } = require('../middleware/authentication');
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
router.use('/health', tokenValidator, authorizedPartyValidator, healthRouter);

/** Email Router */
router.use('/email', tokenValidator, authorizedPartyValidator, emailRouter);

/** Merge Router */
router.use('/emailMerge', tokenValidator, authorizedPartyValidator, mergeRouter);

/** Status Router */
router.use('/status', tokenValidator, authorizedPartyValidator, statusRouter);

/** Cancel Router */
router.use('/cancel', tokenValidator, authorizedPartyValidator, cancelRouter);

/** Promote Router */
router.use('/promote', tokenValidator, authorizedPartyValidator, promoteRouter);

module.exports = router;
