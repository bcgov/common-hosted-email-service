const emailComponent = require('../../components/email');
const emailRouter = require('express').Router();
const {validateEmail, validateMerge} = require('../../middleware/validation');

/** Email sending endpoint */
emailRouter.post('/', validateEmail, async (req, res, next) => {
  try {
    if (req.query.devMode) {
      const result = await emailComponent.sendMailEthereal(req.body);
      res.status(201).json(result);
    } else {
      const result = await emailComponent.sendMailSmtp(req.body);
      res.status(201).json(result);
    }
  } catch (error) {
    next(error);
  }
});

/** Template mail merge & email sending endpoint */
emailRouter.post('/merge', validateMerge, async (req, res, next) => {
  try {
    if (req.query.devMode) {
      const result = await emailComponent.mergeMailEthereal(req.body);
      res.status(201).json(result);
    } else {
      const result = await emailComponent.mergeMailSmtp(req.body);
      res.status(201).json(result);
    }
  } catch (error) {
    next(error);
  }
});

/** Template mail merge validation & preview endpoint */
emailRouter.post('/merge/preview', validateMerge, (req, res, next) => {
  try {
    const result = emailComponent.mergeTemplate(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = emailRouter;
