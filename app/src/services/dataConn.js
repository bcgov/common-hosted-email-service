const Knex = require('knex');
const knexfile = require('../../knexfile');
const log = require('npmlog');
const { Model } = require('objection');

class DataConnection {
  
  constructor () {
    this.configuration = knexfile;
  }
  
  get configuration () {
    return this._configuration;
  }
  
  set configuration (v) {
    this._configuration = v;
    this._connected = false;
    this._knex = this._configuration ? Knex(this._configuration) : undefined;
  }
  
  get knex () {
    return this._knex;
  }
  
  async checkConnection () {
    this._connected = false;
    let { connectOk, schemaOk, modelsOk } = false;
    try {
      const data = await this._knex.raw('SELECT 1+1 AS result');
      connectOk = (data && data.rows && data.rows[0].result === 2);
      if (connectOk) {
        log.info('Database connection ok...');
        const transactionExists = await this._knex.schema.hasTable('trxn');
        const messageExists = await this._knex.schema.hasTable('message');
        const statusExists = await this._knex.schema.hasTable('status');
        const contentExists = await this._knex.schema.hasTable('content');
        const queueExists = await this._knex.schema.hasTable('queue');
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
    this._connected = connectOk && schemaOk && modelsOk;
    return this._connected;
  }
  
}

module.exports = DataConnection;
