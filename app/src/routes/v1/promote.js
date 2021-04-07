const promoteRouter = require('express').Router();
const { validatePromoteQuery, validatePromoteMsg } = require('../../middleware/validation');
const ChesService = require('../../services/chesSvc');

const chesService = new ChesService();

/** Promote multiple delayed messages endpoint */
promoteRouter.post('/', validatePromoteQuery, async (req, res, next) => {
  try {
    await chesService.findPromoteMessages(req.authorizedParty, req.query.msgId,
      req.query.status, req.query.tag, req.query.txId);

    res.status(202)
      .header('Content-Location', req.originalUrl.replace('promote', 'status'))
      .end();
  } catch (err) {
    next(err);
  }
});

/** Promote a single delayed message endpoint */
promoteRouter.post('/:msgId', validatePromoteMsg, async (req, res, next) => {
  try {
    await chesService.promoteMessage(req.authorizedParty, req.params.msgId);

    res.status(202)
      .header('Content-Location', req.originalUrl.replace('promote', 'status'))
      .end();
  } catch (err) {
    next(err);
  }
});

module.exports = promoteRouter;
