const ChesService = require('../../services/chesSvc');
const { validateStatusQuery } = require('../../middleware/validation');

const statusRouter = require('express').Router();
const chesService = new ChesService();

statusRouter.get('/', validateStatusQuery, async (req, res, next) => {
  try {
    // Find messages, transform message and statuses into API format
    const status = await chesService.findStatuses(req.authorizedParty, req.params.msgId,
      req.params.status, req.query.tag, req.query.txId, req.query.fields);

    // Return
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
});

statusRouter.get('/:msgId', async (req, res, next) => {
  try {
    // transform message and statuses into API format...
    const status = await chesService.getStatus(req.authorizedParty, req.params.msgId);

    // return
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
});

module.exports = statusRouter;
