const nunjucks = require('nunjucks');

const utils = require('./utils');


const DataService = require('../services/dataSvc');
const EmailService = require('../services/emailSvc');
const QueueService = require('../services/queueSvc');
const Transformer = require('../services/transform');

const merge = {
  /** Transforms a template into an array of email messages
   *  and sends it to the Ethereal fake SMTP server for viewing
   *  @param {object} template A mail merge template
   *  @returns {string[]} An array of generated Ethereal email urls
   */
  mergeMailEthereal: async template => {
    const emailService = new EmailService();
    const contexts = merge.mergeTemplate(template);
  
    // Send all mail messages with defined transport object
    const results = await Promise.all(contexts.map(context => {
      // Remove delay as we do not use the queue for Ethereal messages
      delete context.delayTS;
      return emailService.send(context, true);
    }));
  
    return results;
  },
  
  /** Transforms a template into an array of email messages
   *  and sends it to the SMTP server
   *  @param {string} client name - authorized party performing the merge.
   *  @param {object} template A mail merge template
   *  @returns {object} a TransactionResponse API object
   */
  mergeMailSmtp: async (client, template) => {
    const dataService = new DataService();
    const queueService = new QueueService();
  
    // build out the individual messages from the payload...
    const contexts = merge.mergeTemplate(template);
  
    // create the transaction and messages...
    let trxn = await dataService.create(client, contexts);
  
    // Send all mail messages with defined transport object
    await Promise.all(trxn.messages.map(msg => {
      const delayTS = msg.delayTimestamp;
      const delay = delayTS ? utils.calculateDelayMS(delayTS) : undefined;
      queueService.enqueue(msg, { delay: delay });
    }));
  
    // fetch the updated transaction/messages/statuses...
    trxn = await dataService.readTransaction(trxn.transactionId);
  
    // return transaction in API format
    return Transformer.transaction(trxn);
  },

  /** Transforms a template into an array of email messages
   *  @param {object} template A mail merge template
   *  @returns {object[]} messages An array of message objects
   */
  mergeTemplate: template => {
    const {
      body,
      contexts,
      subject,
      ...partialTemplate
    } = template;

    return contexts.map(entry => {
      return Object.assign({
        body: merge.renderMerge(body, entry.context),
        cc: entry.cc,
        bcc: entry.bcc,
        delayTS: entry.delayTS,
        subject: merge.renderMerge(subject, entry.context),
        tag: entry.tag,
        to: entry.to,
      }, partialTemplate);
    });
  },

  /** Applies the context onto the template based on the template dialect
   *  @param {string} template A template string
   *  @param {object} context A key/value object store for template population
   *  @param {string} [dialect=nunjucks] The dialect the `template` string is formatted in
   *  @returns {strong} A rendered merge output
   *  @throws When unsupported `dialect` is used
   */
  renderMerge: (template, context, dialect = 'nunjucks') => {
    if (dialect === 'nunjucks') {
      return nunjucks.renderString(template, context);
    } else {
      throw new Error(`Dialect ${dialect} not supported`);
    }
  }
};

module.exports = merge;
