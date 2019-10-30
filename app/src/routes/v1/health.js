const checksRouter = require('express').Router();

const healthCheck = require('../../components/health');

/** Returns the status of correspondent APIs */
checksRouter.get('/', async (_req, res, next) => {
  try {
    const dependencies = await healthCheck.getAll();
    res.status(200).json({
      dependencies: dependencies
    });
  } catch (error) {
    next(error);
  }
});

module.exports = checksRouter;
