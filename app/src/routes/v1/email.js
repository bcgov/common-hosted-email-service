const emailComponent = require('../../components/email');
const queueComponent = require('../../components/queue');

const emailRouter = require('express').Router();
const {
  validateEmail
} = require('../../middleware/validation');

/** Email sending endpoint */
emailRouter.post('/', validateEmail, async (req, res, next) => {
  try {
    if (req.query.devMode) {
      const result = await emailComponent.sendMailEthereal(req.body);
      res.status(201).json(result);
    } else {
      const result = queueComponent.enqueue(req.body);
      res.status(201).json({
        messageId: result
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = emailRouter;
