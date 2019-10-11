const Knex = require('knex');
const knexfile = require('../../../knexfile');
const log = require('npmlog');
const { Model } = require('objection');

let dataConnection;

class DataConnection {
  constructor (config) {
    this.knex = config ? Knex(config) : Knex(knexfile);
  }
  
  db () {
    return this.knex;
  }
  
  async initialize () {
    let { connectOk, schemaOk, modelsOk } = false;
    try {
      const data = await this.knex.raw('SELECT 1+1 AS result');
      connectOk = (data && data.rows && data.rows[0].result === 2);
      if (connectOk) {
        log.info('Database connection ok...');
        const transactionExists = await this.knex.schema.hasTable('trxn');
        const messageExists = await this.knex.schema.hasTable('message');
        const statusExists = await this.knex.schema.hasTable('status');
        const contentExists = await this.knex.schema.hasTable('content');
        const queueExists = await this.knex.schema.hasTable('queue');
        schemaOk = transactionExists && messageExists && statusExists && contentExists && queueExists;
      }
      if (schemaOk) {
        log.info('Database schema ok...');
        Model.knex(this.knex);
        modelsOk = true;
        log.info('Database models ok...');
      }
    } catch (err) {
      log.error(`Error initializing data connection: ${err.message}`);
      log.error(err);
    }
    log.info(`Database connection: Connect OK: ${connectOk}, Schema OK: ${schemaOk}, Models OK: ${modelsOk}`);
    return connectOk && schemaOk && modelsOk;
  }
  
}

class DataConnectionFactory {
  
  static getConnection (config) {
    if (!dataConnection) {
      dataConnection = new DataConnection(config);
    }
    return dataConnection;
  }
}

module.exports = { DataConnectionFactory, DataConnection };
