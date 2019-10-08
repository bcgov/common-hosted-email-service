const log = require('npmlog');
const { Model } = require('objection');

const dataService = {
  
  initialize: async (knex) => {
    let {connectOk, schemaOk, modelsOk} = false;
    try {
      const data = await knex.raw('SELECT 1+1 AS result');
      connectOk = data && data.rows[0].result === 2;
      if (connectOk) {
        log.info('Database connection ok...');
        const transactionExists = await knex.schema.hasTable('trxn');
        const messageExists = await knex.schema.hasTable('message');
        const statusExists = await knex.schema.hasTable('status');
        const contentExists = await knex.schema.hasTable('content');
        schemaOk = transactionExists && messageExists && statusExists && contentExists;
      }
      if (schemaOk) {
        log.info('Database schema ok...');
        Model.knex(knex);
        modelsOk = true;
        log.info('Database models ok...');
      }
    } catch (err) {
      log.error(`Error initializing data services: ${err.message}`);
      log.error(err);
    }
    log.info(`Database initialized: Connect OK: ${connectOk}, Schema OK: ${schemaOk}, Models OK: ${modelsOk}`);
    return connectOk && schemaOk && modelsOk;
  }
  
};

module.exports = dataService;
