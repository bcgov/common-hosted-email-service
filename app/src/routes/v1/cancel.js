const cancelRouter = require('express').Router();
const { validateCancelMsg } = require('../../middleware/validation');
const ChesService = require('../../services/chesSvc');

const chesService = new ChesService();

/** Cancel a single delayed message endpoint */
cancelRouter.delete('/:msgId', validateCancelMsg, async (req, res, next) => {
  try {
    await chesService.cancelMessage(req.authorizedParty, req.params.msgId);

    res.status(202)
      .header('Content-Location', req.originalUrl.replace('cancel', 'status'))
      .end();
  } catch (err) {
    next(err);
  }
});

module.exports = cancelRouter;
