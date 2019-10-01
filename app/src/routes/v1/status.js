const Problem = require('api-problem');

const statusComponent = require('../../components/status');

const statusRouter = require('express').Router();

statusRouter.get('/:msgId', async (req, res, next) => {
  const result = await statusComponent.getMessageId(req.params.msgId);
  if (result) {
    res.status(200).json(result);
  } else {
    next(new Problem(404));
  }
});

module.exports = statusRouter;
