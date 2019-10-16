const ChesService = require('../../services/chesSvc');

const statusRouter = require('express').Router();

statusRouter.get('/:msgId', async (req, res, next) => {
  try {
    const chesService = new ChesService();
    
    // does the caller want the status history?
    const truth = ['1', 'true', 'y', 'yes', 'all'];
    const historyFlag = (req.query.history) ? req.query.history.toString().toLowerCase() : '';
    const includeHistory = truth.includes(historyFlag);
    
    // transform message and statuses into API format...
    const status = await chesService.getStatus(req.authorizedParty, req.params.msgId, includeHistory);
    
    // return
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
});

module.exports = statusRouter;
