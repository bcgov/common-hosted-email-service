const ChesService = require('../../services/chesSvc');
const { validateStatusQuery } = require('../../middleware/validation');

const statusRouter = require('express').Router();
const chesService = new ChesService();

statusRouter.get('/', validateStatusQuery, async (req, res, next) => {
  try {
    const { fields, ...params } = req.query;

    // Return
    res.status(200).json({
      fields: fields,
      params: params
    });
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
