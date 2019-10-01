const nunjucks = require('nunjucks');

const emailComponent = require('./email');
const queueComponent = require('./queue');

const merge = {
  /** Transforms a template into an array of email messages
   *  and sends it to the Ethereal fake SMTP server for viewing
   *  @param {object} template A mail merge template
   *  @returns {string[]} An array of generated Ethereal email urls
   */
  mergeMailEthereal: async template => {
    const messages = merge.mergeTemplate(template);

    // Send all mail messages with defined transport object
    const results = await Promise.all(messages.map(message => {
      return emailComponent.sendMailEthereal(message);
    }));

    return results;
  },

  /** Transforms a template into an array of email messages
   *  and sends it to the SMTP server
   *  @param {object} template A mail merge template
   *  @returns {object[]} An array of nodemailer result objects
   */
  mergeMailSmtp: async template => {
    const messages = merge.mergeTemplate(template);

    // Send all mail messages with defined transport object
    const results = await Promise.all(messages.map(message => {
      return {
        msgId: queueComponent.enqueue(message)
      };
    }));

    return results;
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
        to: entry.to,
        cc: entry.cc,
        bcc: entry.bcc,
        subject: merge.renderMerge(subject, entry.context)
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
