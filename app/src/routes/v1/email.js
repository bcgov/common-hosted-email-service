const emailRouter = require('express').Router();
const { validateEmail } = require('../../middleware/validation');
const ChesService = require('../../services/chesSvc');

const chesService = new ChesService();

/** Email sending endpoint */
emailRouter.post('/', validateEmail, async (req, res, next) => {
  try {
    const ethereal = (req.query.devMode !== undefined);


    const result = await chesService.sendEmail(req.authorizedParty, req.body, ethereal);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = emailRouter;
