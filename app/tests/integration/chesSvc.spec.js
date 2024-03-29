/**
 * @module chesSvc.spec
 *
 * Jest tests for the ChesService class.
 * These tests require a full set of (running) infrastructure.
 * - Postgresql database
 * - Redis Queue
 * - Email server
 *
 * It will run migrations before the tests, and then purge any test data when completed.
 *
 * @see ChesService
 * @see DataService
 * @see EmailService
 * @see QueueService
 */
const Bull = require('bull');
const config = require('config');
const Knex = require('knex');
const { NotFoundError } = require('objection');
const uuid = require('uuid');
const Problem = require('api-problem');

const { statusState, queueState } = require('../../src/components/state');
const utils = require('../../src/components/utils');

const DataConnection = require('../../src/services/dataConn');
const EmailConnection = require('../../src/services/emailConn');
const QueueConnection = require('../../src/services/queueConn');

const ChesService = require('../../src/services/chesSvc');
const DataService = require('../../src/services/dataSvc');
const EmailService = require('../../src/services/emailSvc');
const {
  ClientMismatchError,
  DataIntegrityError,
  UncancellableError,
  QueueService
} = require('../../src/services/queueSvc');

const { deleteTransactionsByClient } = require('./dataUtils');

jest.mock('../../src/services/queueSvc');

const knexfile = require('../../knexfile');

const emails = [
  {
    'attachments': [],
    'bcc': [],
    'bodyType': 'html',
    'body': 'first sample email',
    'cc': [],
    'encoding': 'utf-8',
    'from': 'mitch connors <mitchymitch@mitchconnors.org>',
    'priority': 'normal',
    'to': ['doctor@krieger.org', 'Joey Joe-Joe Jr <joeyjoejoejr@shabadoo.org>'],
    'subject': 'Hello user',
    'tag': 'a tag value',
    'delayTS': 1570000000000
  }, {
    'attachments': [],
    'bcc': [],
    'bodyType': 'text',
    'body': 'second sample email',
    'cc': [],
    'encoding': 'utf-8',
    'from': 'willienelson@willieandthefaily.org',
    'priority': 'normal',
    'to': ['waylon@waylonjenningsss.org'],
    'subject': 'Hello Walls',
    'tag': 'business key',
    'delayTS': 1570000000000
  }];

const template = {
  'attachments': [],
  'from': 'mitchymitch@mitchconnors.org',
  'priority': 'normal',
  'encoding': 'utf-8',
  'bodyType': 'text',
  'body': '{{ something.greeting }} {{ something.target }} content',
  'subject': 'Hello {{ someone }}',
  'contexts': [
    {
      'to': ['willienelson@willieandthefaily.org'],
      'context': {
        'something': {
          'greeting': 'Hello',
          'target': 'Walls'
        },
        'someone': 'red headed stranger'
      }
    },
    {
      'to': ['johnny@cassssh.org'],
      'context': {
        'something': {
          'greeting': 'Hello',
          'target': 'Im Johnny Cash'
        },
        'someone': 'i still miss'
      }
    }
  ]
};

jest.setTimeout(10000);

// TODO: Fix this entire integration test suite - it's been busted post OCP4 refactor
describe.skip('chesService', () => {
  let knex;
  let dataService;
  let emailService;
  let queueService;
  let chesService;

  const CLIENT = `ches-svc-testing-${new Date().toISOString()}`;

  beforeAll(async () => {

    knex = Knex(knexfile);
    await knex.migrate.latest();

    const dataConnection = new DataConnection();
    const dataConnectionOK = await dataConnection.checkAll();
    if (!dataConnectionOK) {
      throw Error('Error initializing data connection');
    }

    const emailConnection = new EmailConnection();
    const emailConnectionOK = await emailConnection.checkConnection();
    if (!emailConnectionOK) {
      throw Error('Error initializing email connection');
    }

    const queueConnection = new QueueConnection();
    queueConnection.queue = new Bull('ches-svc-testing', {
      redis: {
        host: config.get('redis.host'),
        password: config.get('redis.password')
      }
    });
    const queueConnectionOK = await queueConnection.checkConnection();
    if (!queueConnectionOK) {
      throw Error('Error initializing queue connection');
    }

    dataService = new DataService();
    dataService.connection = dataConnection;

    emailService = new EmailService();
    emailService.connection = emailConnection;

    queueService = new QueueService();
    queueService.connection = queueConnection;

    chesService = new ChesService();
    chesService.dataService = dataService;
    chesService.emailService = emailService;
    chesService.queueService = queueService;
  });

  afterAll(async () => {
    // TODO: Find better way to allow connections to finish before cleanup
    await utils.wait(3000);
    await deleteTransactionsByClient(CLIENT);
    QueueConnection.close();
    return knex.destroy();
  });

  afterEach(async () => {
    await deleteTransactionsByClient(CLIENT);
  });

  describe('cancelMessage', () => {
    const spy = QueueService.prototype.removeJob;

    afterEach(async () => {
      spy.mockRestore();
    });

    it('should throw a 400 when client is null', async () => {
      try {
        await chesService.cancelMessage(undefined, uuid.v4());
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('400');
      }

      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw a 400 when messageId is null', async () => {
      try {
        await chesService.cancelMessage(CLIENT, undefined);
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('400');
      }

      expect(spy).not.toHaveBeenCalled();
    });

    it('should throw a 403 when client is mismatched', async () => {
      spy.mockImplementation(() => { throw new ClientMismatchError(); });
      const trxn = await chesService.sendEmail(CLIENT, emails[0], false);

      try {
        await chesService.cancelMessage('wrong client', trxn.messages[0].msgId);
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('403');
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('wrong client', trxn.messages[0].msgId);
    });

    it('should throw a 404 when message is not found', async () => {
      spy.mockResolvedValue(false);
      const msgId = uuid.v4();

      try {
        await chesService.cancelMessage(CLIENT, msgId);
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('404');
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(CLIENT, msgId);
    });

    it('should throw a 409 when is uncancellable', async () => {
      spy.mockResolvedValue(false);
      const trxn = await chesService.sendEmail(CLIENT, emails[0], false);
      await dataService.updateStatus(CLIENT, trxn.messages[0].msgId, queueState.REMOVED);

      try {
        await chesService.cancelMessage(CLIENT, trxn.messages[0].msgId);
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('409');
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId);
    });

    it('should throw a 500 when there is inconsistent data', async () => {
      spy.mockImplementation(() => { throw new DataIntegrityError(); });
      const trxn = await chesService.sendEmail(CLIENT, emails[0], false);

      try {
        await chesService.cancelMessage(CLIENT, trxn.messages[0].msgId);
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('500');
      }

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId);
    });

  });

  describe('findCancelMessages', () => {
    const CLIENT = `ches-svc-findCancelMessages-${new Date().toISOString()}`;

    const findSpy = jest.spyOn(DataService.prototype, 'findMessagesByQuery');
    const removeSpy = jest.spyOn(QueueService.prototype, 'removeJob');
    const fn = (...args) => {
      return chesService.findCancelMessages(...args);
    };

    afterEach(async () => {
      findSpy.mockClear();
      removeSpy.mockClear();
      await deleteTransactionsByClient(CLIENT);
    });

    it('should throw an error with no parameters provided', async () => {
      await expect(fn()).rejects.toThrow();

      expect(findSpy).toHaveBeenCalledTimes(0);
      expect(removeSpy).toHaveBeenCalledTimes(0);
    });

    it('should return nothing with no search parameters', async () => {
      const result = await fn(CLIENT);

      expect(result).toBeFalsy();
      expect(findSpy).toHaveBeenCalledTimes(1);
      expect(findSpy).toHaveBeenCalledWith(CLIENT, undefined, undefined, undefined, undefined);
      expect(removeSpy).toHaveBeenCalledTimes(0);
    });

    it('should return nothing with all nonexistent search parameters', async () => {
      const msgId = uuid.v4();
      const txId = uuid.v4();
      const status = statusState.COMPLETED;
      const tag = 'tag';

      const result = await fn(CLIENT, msgId, status, tag, txId);

      expect(result).toBeFalsy();
      expect(findSpy).toHaveBeenCalledTimes(1);
      expect(findSpy).toHaveBeenCalledWith(CLIENT, msgId, status, tag, txId);
      expect(removeSpy).toHaveBeenCalledTimes(0);
    });

    it('should return nothing with one message ', async () => {
      const trxn = await chesService.sendEmail(CLIENT, emails[0], false);

      const result = await fn(CLIENT, trxn.messages[0].msgId, undefined, undefined, trxn.txId);

      expect(result).toBeFalsy();
      expect(findSpy).toHaveBeenCalledTimes(1);
      expect(findSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId, undefined, undefined, trxn.txId);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId);
    });

    it('should return nothing when there is a ClientMismatchError', async () => {
      const trxn = await chesService.sendEmail(CLIENT, emails[0], false);
      removeSpy.mockImplementation(() => {
        throw new ClientMismatchError('test');
      });

      const result = await fn(CLIENT, trxn.messages[0].msgId, undefined, undefined, undefined);

      expect(result).toBeFalsy();
      expect(findSpy).toHaveBeenCalledTimes(1);
      expect(findSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId, undefined, undefined, undefined);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId);
    });

    it('should return nothing when there is a NotFoundError', async () => {
      const trxn = await chesService.sendEmail(CLIENT, emails[0], false);
      removeSpy.mockImplementation(() => {
        throw new NotFoundError('test');
      });

      const result = await fn(CLIENT, trxn.messages[0].msgId, undefined, undefined, undefined);

      expect(result).toBeFalsy();
      expect(findSpy).toHaveBeenCalledTimes(1);
      expect(findSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId, undefined, undefined, undefined);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId);
    });

    it('should return nothing when there is a UncancellableError', async () => {
      const trxn = await chesService.sendEmail(CLIENT, emails[0], false);
      removeSpy.mockImplementation(() => {
        throw new UncancellableError('test');
      });

      const result = await fn(CLIENT, trxn.messages[0].msgId, undefined, undefined, undefined);

      expect(result).toBeFalsy();
      expect(findSpy).toHaveBeenCalledTimes(1);
      expect(findSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId, undefined, undefined, undefined);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId);
    });

    it('should throw an error when there is a DataIntegrityError', async () => {
      const trxn = await chesService.sendEmail(CLIENT, emails[0], false);
      removeSpy.mockImplementation(() => {
        throw new DataIntegrityError('test');
      });

      await expect(fn(CLIENT, trxn.messages[0].msgId, undefined, undefined, undefined)).rejects.toThrow(new Problem(500, {
        detail: 'Some message(s) are inconsistent or corrupted.',
        messages: [
          trxn.messages[0].msgId
        ]
      }));

      expect(findSpy).toHaveBeenCalledTimes(1);
      expect(findSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId, undefined, undefined, undefined);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId);
    });

    it('should throw an error when there is a generic error', async () => {
      const errMsg = 'test';
      const trxn = await chesService.sendEmail(CLIENT, emails[0], false);
      removeSpy.mockImplementation(() => {
        throw new Error(errMsg);
      });

      await expect(fn(CLIENT, trxn.messages[0].msgId, undefined, undefined, undefined)).rejects.toThrow(new Problem(500, { detail: `Unexpected Error: ${errMsg}` }));

      expect(findSpy).toHaveBeenCalledTimes(1);
      expect(findSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId, undefined, undefined, undefined);
      expect(removeSpy).toHaveBeenCalledTimes(1);
      expect(removeSpy).toHaveBeenCalledWith(CLIENT, trxn.messages[0].msgId);
    });

  });

  describe('findStatuses', () => {
    const CLIENT = `ches-svc-findStatuses-${new Date().toISOString()}`;
    const spy = jest.spyOn(DataService.prototype, 'findMessagesByQuery');
    const fn = (...args) => {
      return chesService.findStatuses(...args);
    };

    afterEach(async () => {
      spy.mockClear();
      await deleteTransactionsByClient(CLIENT);
    });

    it('should throw an error if no parameters were provided', async () => {
      await expect(fn()).rejects.toThrow();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(undefined, undefined, undefined, undefined, undefined);
    });

    it('should return an empty array with no search parameters', async () => {

      const result = await fn(CLIENT);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toHaveLength(0);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(CLIENT, undefined, undefined, undefined, undefined);

      await deleteTransactionsByClient(CLIENT);
    });

    it('should return an empty array with all nonexistent search parameters', async () => {
      const msgId = uuid.v4();
      const txId = uuid.v4();
      const result = await fn(CLIENT, msgId, 'status', 'tag', txId);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toHaveLength(0);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(CLIENT, msgId, 'status', 'tag', txId);
    });

    it('should return an array of message statuses', async () => {
      const trxn = await chesService.sendEmail(CLIENT, emails[0], false);

      const result = await fn(CLIENT, undefined, undefined, undefined, trxn.txId);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toHaveLength(1);
      expect(result[0]).toBeTruthy();
      expect(result[0].txId).toMatch(trxn.txId);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(CLIENT, undefined, undefined, undefined, trxn.txId);
    });

  });

  describe('getStatus', () => {

    it('should throw a 400 when no message id.', async () => {
      try {
        await chesService.getStatus(CLIENT, undefined);
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('400');
      }
    });

    it('should throw a 404 with invalid message id.', async () => {
      try {
        await chesService.getStatus(CLIENT, uuid.v4());
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('404');
      }
    });

    it('should return a status.', async () => {
      const email = emails[0];
      const trxn = await dataService.createTransaction(CLIENT, email);

      const result = await chesService.getStatus(CLIENT, trxn.messages[0].messageId);

      expect(result).toBeTruthy();
      expect(result.msgId).toMatch(trxn.messages[0].messageId);
      expect(result.statuses).toBeFalsy();

    });

    it('should return a status with status history.', async () => {
      const email = emails[0];
      const trxn = await dataService.createTransaction(CLIENT, email);

      const result = await chesService.getStatus(CLIENT, trxn.messages[0].messageId, true);

      expect(result).toBeTruthy();
      expect(result.msgId).toMatch(trxn.messages[0].messageId);
      expect(result.statusHistory).toBeTruthy();
      expect(result.statusHistory).toHaveLength(1);
    });

  });

  describe('sendEmail', () => {

    it('should throw a 400 when no message.', async () => {
      try {
        await chesService.sendEmail(CLIENT, undefined, false);
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('400');
      }
    });

    // TODO: There may exist some concurrency issues here
    it('should throw a 400 when no client and not ethereal .', async () => {
      try {
        await chesService.sendEmail(undefined, emails[0], false);
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('400');
      }
    });

    it('should return a transaction.', async () => {
      const result = await chesService.sendEmail(CLIENT, emails[0], false);
      expect(result).toBeTruthy();
      expect(result.txId).toBeTruthy();
      expect(result.messages).toBeTruthy();
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].msgId).toBeTruthy();
      expect(result.messages[0].to).toEqual(emails[0].to);
    });

    /*
    it('should return a url when ethereal.', async () => {
      const result = await chesService.sendEmail(CLIENT, emails[0], true);
      expect(result).toBeTruthy();
    });
    */
  });

  describe('sendEmailMerge', () => {

    it('should throw a 400 when no template.', async () => {
      try {
        await chesService.sendEmailMerge(CLIENT, undefined, false);
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('400');
      }
    });

    // TODO: There may exist some concurrency issues here
    it('should throw a 400 when no client and not ethereal.', async () => {
      try {
        await chesService.sendEmailMerge(undefined, template, false);
      } catch (e) {
        expect(e).toBeTruthy();
        expect(e.status).toBe('400');
      }
    });

    it('should return a transaction.', async () => {
      const result = await chesService.sendEmailMerge(CLIENT, template, false);
      expect(result).toBeTruthy();
      expect(result.txId).toBeTruthy();
      expect(result.messages).toBeTruthy();
      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].msgId).toBeTruthy();
      expect(result.messages[0].to).toHaveLength(1);
      expect(result.messages[0].msgId).toBeTruthy();
      expect(result.messages[0].to).toHaveLength(1);

      // TODO: Find better way to allow connections to finish before cleanup
      // This should be in a top-level afterEach but extends the test time significantly
      // Revisit this when we need better test/connection isolation
      await utils.wait(1000);
    });

    /*
    it('should return an array urls when ethereal.', async () => {
      const result = await chesService.sendEmailMerge(CLIENT, template, true);
      expect(result).toBeTruthy();
      expect(result).toHaveLength(2);
    });
    */
  });

});
