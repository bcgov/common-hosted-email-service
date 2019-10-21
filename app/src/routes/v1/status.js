const ChesService = require('../../services/chesSvc');

const statusRouter = require('express').Router();

statusRouter.get('/:msgId', async (req, res, next) => {
  try {
    const chesService = new ChesService();

    // transform message and statuses into API format...
    const status = await chesService.getStatus(req.authorizedParty, req.params.msgId);

    // return
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
});

module.exports = statusRouter;
