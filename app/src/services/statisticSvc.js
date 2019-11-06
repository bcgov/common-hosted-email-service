/**
 * @module StatisticsService
 *
 * Service to persist/write data for Stackpole.
 *
 *
 * @see DataConnection
 * @see Objection
 * @see knex
 *
 * @exports StatisticsService
 */
const log = require('npmlog');
const { transaction } = require('objection');

const DataConnection = require('./dataConn');

const Statistic = require('./models/statistic');

class StatisticsService {

  /**
   * Creates a new DataService with default connection.
   * @class
   */
  constructor() {
    this.connection = new DataConnection();
  }

  /** @function connection
   *  Gets the current DataConnection
   */
  get connection() {
    return this._connection;
  }

  /** @function connection
   *  Sets the current DataConnection
   *  @param {object} v - an DataConnection
   */
  set connection(v) {
    this._connection = v;
  }

  /** @function write
   *  Create Statistic record(s) in database
   *
   *  @returns {object} Statistic object
   */
  async write(...statistics) {
    if (!statistics) return;

    let trx;
    try {
      trx = await transaction.start(Statistic.knex());

      await Promise.all(statistics.map(stat => {
        return Statistic.query(trx).insert(stat);
      }));

      await trx.commit();

    } catch (err) {
      log.error(`Error creating statistic records: ${err.message}. Rolling back,..`);
      log.error(err);
      if (trx) await trx.rollback();
      throw err;
    }
  }

}

module.exports = StatisticsService;
