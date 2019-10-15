const emailRouter = require('express').Router();
const { validateEmail } = require('../../middleware/validation');

const ChesService = require('../../services/chesSvc');

/** Email sending endpoint */
emailRouter.post('/', validateEmail, async (req, res, next) => {
  try {
    const ethereal = (req.query.devMode !== undefined);

    const chesService = new ChesService();
    const result = await chesService.sendEmail(req.authorizedParty, req.body, ethereal);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = emailRouter;
