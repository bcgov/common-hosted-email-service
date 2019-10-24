const statusRouter = require('express').Router();
const { validateStatusFetch, validateStatusQuery } = require('../../middleware/validation');
const ChesService = require('../../services/chesSvc');

const chesService = new ChesService();

statusRouter.get('/', validateStatusQuery, async (req, res, next) => {
  try {
    // Find messages, transform message and statuses into API format
    const status = await chesService.findStatuses(req.authorizedParty, req.query.msgId,
      req.query.status, req.query.tag, req.query.txId, req.query.fields);

    // Return
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
});

statusRouter.get('/:msgId', validateStatusFetch, async (req, res, next) => {
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
