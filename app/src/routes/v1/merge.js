const mergeComponent = require('../../components/merge');

const mergeRouter = require('express').Router();
const { validateMerge } = require('../../middleware/validation');
const ChesService = require('../../services/chesSvc');

/** Template mail merge & email sending endpoint */
mergeRouter.post('/', validateMerge, async (req, res, next) => {
  try {
    const ethereal = (req.query.devMode !== undefined);

    const chesService = new ChesService();
    const result = await chesService.sendEmailMerge(req.authorizedParty, req.body, ethereal);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

/** Template mail merge validation & preview endpoint */
mergeRouter.post('/preview', validateMerge, (req, res, next) => {
  try {
    const result = mergeComponent.mergeTemplate(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = mergeRouter;
