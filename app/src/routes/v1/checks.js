const checksRouter = require('express').Router();
const Problem = require('api-problem');

const checkComponent = require('../../components/checks');

// returns the status of correspondent apis
checksRouter.get('/status', async (_req, res) => {
  const statuses = await checkComponent.getStatus();

  if (statuses instanceof Array) {
    res.status(200).json({
      endpoints: statuses
    });
  } else {
    new Problem(500, {
      detail: 'Unable to get API status list'
    }).send(res);
  }
});

module.exports = checksRouter;
