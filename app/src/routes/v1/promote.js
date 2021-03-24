const promoteRouter = require('express').Router();
const { validatePromoteMsg } = require('../../middleware/validation');
const ChesService = require('../../services/chesSvc');

const chesService = new ChesService();

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
