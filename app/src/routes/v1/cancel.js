const cancelRouter = require('express').Router();
const { validateCancelMsg } = require('../../middleware/validation');
// const ChesService = require('../../services/chesSvc');

// const chesService = new ChesService();

cancelRouter.delete('/:msgId', validateCancelMsg, async (req, res, next) => {
  try {
    const Problem = require('api-problem');
    throw new Problem(501);
  } catch (err) {
    next(err);
  }
});

module.exports = cancelRouter;
