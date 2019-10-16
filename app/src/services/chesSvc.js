const log = require('npmlog');
const { NotFoundError } = require('objection');
const Problem = require('api-problem');

const mergeComponent = require('../components/merge');
const utils = require('../components/utils');

const DataService = require('./dataSvc');
const EmailService = require('./emailSvc');
const QueueService = require('./queueSvc');
const Transformer = require('./transform');

class ChesService {
  
  constructor () {
    this.dataService = new DataService();
    this.emailService = new EmailService();
    this.queueService = new QueueService();
  }
  
  get dataService () {
    return this._dataService;
  }
  
  set dataService (v) {
    this._dataService = v;
  }
  
  get emailService () {
    return this._emailService;
  }
  
  set emailService (v) {
    this._emailService = v;
  }
  
  get queueService () {
    return this._queueService;
  }
  
  set queueService (v) {
    this._queueService = v;
  }
  
  async getStatus (client, messageId, includeStatusHistory = false) {
    if (!messageId) {
      throw new Problem(400, { detail: 'Error getting status. Message Id cannot be null' });
    }
    
    try {
      // fetch the message and statuses... (throws error if not found)
      const msg = await this.dataService.readMessage(client, messageId);
      
      // transform message and statuses into API format...
      const status = Transformer.status(msg, includeStatusHistory);
      return status;
    } catch (e) {
      if (e instanceof NotFoundError) {
        log.error(`Get Status for client = ${client} & messageId = ${messageId} error. Message not found`);
        throw new Problem(404, { detail: `Error getting status for message ${messageId} (Client ${client}). Message not found.` });
      } else {
        log.error(`Get Status for client = ${client} & messageId = ${messageId} error. ${e.message}`);
        log.error(JSON.stringify(e, null, 2));
        throw new Problem(500, { detail: `Error getting status for client = ${client} & messageId = ${messageId}. ${e.message}` });
      }
    }
  }
  
  async sendEmail (client, message, ethereal = false) {
    if (!message) {
      throw new Problem(400, { detail: 'Error sending email. Email message cannot be null' });
    }
    if (!ethereal && !client) {
      throw new Problem(400, { detail: 'Error sending email. Authorized Party/Client cannot be null' });
    }
    
    try {
      if (ethereal) {
        const result = await this.emailService.send(message, true);
        return result;
      } else {
        // create the transaction...
        let trxn = await this.dataService.createTransaction(client, message);
        
        // queue up the messages...
        const delayTS = trxn.messages[0].delayTimestamp;
        const delay = delayTS ? utils.calculateDelayMS(delayTS) : undefined;
        await this.queueService.enqueue(client, trxn.messages[0], { delay: delay });
        
        // fetch the transaction/messages/statuses...
        trxn = await this.dataService.readTransaction(client, trxn.transactionId);
        
        //return to caller in API format
        return Transformer.transaction(trxn);
      }
    } catch (e) {
      log.error(`Send Email error. ${e.message}`);
      log.error(JSON.stringify(e, null, 2));
      throw new Problem(500, { detail: `Error sending email. ${e.message}` });
    }
  }
  
  async sendEmailMerge (client, template, ethereal = false) {
    if (!template) {
      throw new Problem(400, { detail: 'Error sending email merge. Email templates/contexts cannot be null' });
    }
    if (!ethereal && !client) {
      throw new Problem(400, { detail: 'Error sending email merge. Authorized Party/Client cannot be null' });
    }
    
    try {
      if (ethereal) {
        const contexts = mergeComponent.mergeTemplate(template);
        
        // Send all mail messages with defined transport object
        const results = await Promise.all(contexts.map(context => {
          // Remove delay as we do not use the queue for Ethereal messages
          delete context.delayTS;
          return this.emailService.send(context, true);
        }));
        
        return results;
      } else {
        // build out the individual messages from the payload...
        const contexts = mergeComponent.mergeTemplate(template);
        
        // create the transaction and messages...
        let trxn = await this.dataService.createTransaction(client, contexts);
        
        // Send all mail messages with defined transport object
        await Promise.all(trxn.messages.map(msg => {
          const delayTS = msg.delayTimestamp;
          const delay = delayTS ? utils.calculateDelayMS(delayTS) : undefined;
          this.queueService.enqueue(client, msg, { delay: delay });
        }));
        
        // fetch the updated transaction/messages/statuses...
        trxn = await this.dataService.readTransaction(client, trxn.transactionId);
        
        // return transaction in API format
        return Transformer.transaction(trxn);
      }
    } catch (e) {
      log.error(`Send Email Merge error. ${e.message}`);
      log.error(JSON.stringify(e, null, 2));
      throw new Problem(500, { detail: `Error sending email merge. ${e.message}` });
    }
  }
}

module.exports = ChesService;
