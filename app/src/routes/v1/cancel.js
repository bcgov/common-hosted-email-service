const cancelRouter = require('express').Router();
const { validateCancelQuery, validateCancelMsg } = require('../../middleware/validation');
const ChesService = require('../../services/chesSvc');

const chesService = new ChesService();

/** Cancel multiple delayed messages endpoint */
cancelRouter.delete('/', validateCancelQuery, async (req, res, next) => {
  try {
    await chesService.findCancelMessages(req.authorizedParty, req.query.msgId?.toLowerCase(),
      req.query.status, req.query.tag, req.query.txId?.toLowerCase());

    res.status(202)
      .header('Content-Location', req.originalUrl.replace('cancel', 'status'))
      .end();
  } catch (err) {
    next(err);
  }
});

/** Cancel a single delayed message endpoint */
cancelRouter.delete('/:msgId', validateCancelMsg, async (req, res, next) => {
  try {
    await chesService.cancelMessage(req.authorizedParty, req.params.msgId.toLowerCase());

    res.status(202)
      .header('Content-Location', req.originalUrl.replace('cancel', 'status'))
      .end();
  } catch (err) {
    next(err);
  }
});

module.exports = cancelRouter;
