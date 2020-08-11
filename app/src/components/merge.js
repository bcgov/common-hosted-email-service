const nunjucks = require('nunjucks');

const merge = {
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
        encryptionKeys: entry.encryptionKeys,
        subject: merge.renderMerge(subject, entry.context),
        tag: entry.tag,
        to: entry.to
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
