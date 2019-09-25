const mergeComponent = require('../../components/merge');

const emailRouter = require('express').Router();
const {
  validateMerge
} = require('../../middleware/validation');

/** Template mail merge & email sending endpoint */
emailRouter.post('/', validateMerge, async (req, res, next) => {
  try {
    if (req.query.devMode) {
      const result = await mergeComponent.mergeMailEthereal(req.body);
      res.status(201).json(result);
    } else {
      const result = await mergeComponent.mergeMailSmtp(req.body);
      res.status(201).json(result);
    }
  } catch (error) {
    next(error);
  }
});

/** Template mail merge validation & preview endpoint */
emailRouter.post('/preview', validateMerge, (req, res, next) => {
  try {
    const result = mergeComponent.mergeTemplate(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = emailRouter;
