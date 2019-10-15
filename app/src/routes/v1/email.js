const utilsComponent = require('../../components/utils');

const emailRouter = require('express').Router();
const { validateEmail } = require('../../middleware/validation');

const DataService = require('../../services/dataSvc');
const EmailService = require('../../services/emailSvc');
const QueueService = require('../../services/queueSvc');
const Transformer = require('../../services/transform');

/** Email sending endpoint */
emailRouter.post('/', validateEmail, async (req, res, next) => {
  try {
    if (req.query.devMode) {
      const emailService = new EmailService();
      const result = await emailService.send(req.body, true);
      res.status(201).json(result);
    } else {
      const dataService = new DataService();
      const queueService = new QueueService();
      
      // create the transaction...
      let trxn = await dataService.create(req.authorizedParty, req.body);
      
      // queue up the messages...
      const delayTS = trxn.messages[0].delayTimestamp;
      const delay = delayTS ? utilsComponent.calculateDelayMS(delayTS) : undefined;
      await queueService.enqueue(trxn.messages[0], { delay: delay });
      
      // fetch the transaction/messages/statuses...
      trxn = await dataService.readTransaction(trxn.transactionId);
      
      //return to caller in API format
      res.status(201).json(Transformer.transaction(trxn));
    }
  } catch (error) {
    next(error);
  }
});

module.exports = emailRouter;
