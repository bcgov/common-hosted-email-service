/**
 * @module statisticSvc.spec
 *
 * Jest tests for the StatisticService class.
 * These tests require a configured connection to a Postgresql database.
 * It will run migrations before the tests, and then purge any test data when completed.
 *
 * @see DataService
 */
const helper = require('../common/helper');
const Knex = require('knex');
const uuidv4 = require('uuid/v4');

const DataConnection = require('../../src/services/dataConn');
const StatisticsService = require('../../src/services/statisticSvc');

const { countStatisticsByClient, deleteStatisticsByClient } = require('./dataUtils');

helper.logHelper();

const config = require('../../knexfile');

describe('statisticsService', () => {
  let knex;
  let statisticsService;
  const CLIENT = `unittesting-${new Date().toISOString()}`;

  beforeAll(async () => {
    knex = Knex(config);
    await knex.migrate.latest();
    const dataConnection = new DataConnection();
    const connectOK = await dataConnection.checkConnection();
    if (!connectOK) {
      throw Error('Error initializing dataService');
    }
    statisticsService = new StatisticsService();
  });
  afterAll(async () => {
    await deleteStatisticsByClient(CLIENT);
    return knex.destroy();
  });

  afterEach(async () => {
    await deleteStatisticsByClient(CLIENT);
  });

  describe('constructor', () => {
    it('should return false on initializing data service without knex', async () => {
      const dataConnection = new DataConnection();
      dataConnection.knex = undefined;
      const connectOK = await dataConnection.checkConnection();
      expect(connectOK).toBeFalsy();
    });
  });

  describe('write', () => {
    it('should not do anything when writing nothing', async () => {
      expect(async () => await statisticsService.write(null)).not.toThrow();
    });

    it('should create a statistic', async () => {
      const stat = {
        client: CLIENT,
        operation: 'op',
        transactionId: uuidv4(),
        messageId: uuidv4(),
        status: 'asdfasdf',
        timestamp: new Date(),
        delay: null
      };
      await statisticsService.write(stat);
      const recs = await countStatisticsByClient(CLIENT);
      expect(recs).toBe(1);
    });

    it('should create multiple statistics with array param', async () => {
      const stat = {
        client: CLIENT,
        operation: 'op',
        transactionId: uuidv4(),
        messageId: uuidv4(),
        status: 'asdfasdf',
        timestamp: new Date(),
        delay: null
      };
      await statisticsService.write([stat, stat]);
      const recs = await countStatisticsByClient(CLIENT);
      expect(recs).toBe(2);
    });

    it('should create multiple statistics with multiple params', async () => {
      const stat = {
        client: CLIENT,
        operation: 'op',
        transactionId: uuidv4(),
        messageId: uuidv4(),
        status: 'asdfasdf',
        timestamp: new Date(),
        delay: null
      };
      await statisticsService.write(stat, stat, stat);
      const recs = await countStatisticsByClient(CLIENT);
      expect(recs).toBe(3);
    });
  });

});

