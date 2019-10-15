const Problem = require('api-problem');

const DataService = require('../../services/dataSvc');
const Transformer = require('../../services/transform');

const statusRouter = require('express').Router();

statusRouter.get('/:msgId', async (req, res, next) => {
  try {
    const dataService = new DataService();
    
    // fetch the message and statuses... (throws error if not found)
    const msg = await dataService.readMessage(req.params.msgId);
    
    // does the caller want the status history?
    const truth = ['1', 'true', 'y', 'yes', 'all'];
    const historyFlag = (req.query.history) ? req.query.history.toString().toLowerCase() : '';
    const includeHistory = truth.includes(historyFlag);
    
    // transform message and statuses into API format...
    const status = Transformer.status(msg, includeHistory);
    
    // return
    res.status(200).json(status);
  } catch (err) {
    next(new Problem(404));
  }
});

module.exports = statusRouter;
