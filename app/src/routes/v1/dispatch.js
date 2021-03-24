const dispatchRouter = require('express').Router();
const { validateDispatchMsg } = require('../../middleware/validation');
const ChesService = require('../../services/chesSvc');

const chesService = new ChesService();

/** Dispatch a single delayed message endpoint */
dispatchRouter.post('/:msgId', validateDispatchMsg, async (req, res, next) => {
  try {
    await chesService.dispatchMessage(req.authorizedParty, req.params.msgId);

    res.status(202)
      .header('Content-Location', req.originalUrl.replace('dispatch', 'status'))
      .end();
  } catch (err) {
    next(err);
  }
});

module.exports = dispatchRouter;
