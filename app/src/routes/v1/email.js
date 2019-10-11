const utilsComponent = require('../../components/utils');

const emailRouter = require('express').Router();
const { validateEmail } = require('../../middleware/validation');

const { DataServiceFactory } = require('../../services/data/service');
const { EmailServiceFactory } = require('../../services/email/service');
const { QueueServiceFactory } = require('../../services/queue/service');
const { transformer } = require('../../services/data/transform');

/** Email sending endpoint */
emailRouter.post('/', validateEmail, async (req, res, next) => {
  try {
    if (req.query.devMode) {
      const emailService = await EmailServiceFactory.getEtherealInstance();
      const result = await emailService.sendMail(req.body, true);
      res.status(201).json(result);
    } else {
      const dataService = DataServiceFactory.getService();
      const queueService = QueueServiceFactory.getService();
      // create the transaction...
      let trxn = await dataService.create(req.authorizedParty, req.body);
      
      // queue up the messages...
      const delayTS = trxn.messages[0].delayTimestamp;
      const delay = delayTS ? utilsComponent.calculateDelayMS(delayTS) : undefined;
      await queueService.enqueue(trxn.messages[0], { delay: delay });
      
      // fetch the transaction/messages/statuses...
      trxn = await dataService.readTransaction(trxn.transactionId);
      
      //return to caller in API format
      res.status(201).json(transformer.transaction(trxn));
    }
  } catch (error) {
    next(error);
  }
});

module.exports = emailRouter;
