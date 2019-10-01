const emailComponent = require('../../components/email');
const queueComponent = require('../../components/queue');
const utilsComponent = require('../../components/utils');

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
      const { delayTS, ...message } = req.body;
      const result = queueComponent.enqueue(message, {
        delay: delayTS ? utilsComponent.calculateDelayMS(delayTS) : undefined
      });
      res.status(201).json({
        msgId: result
      });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = emailRouter;
