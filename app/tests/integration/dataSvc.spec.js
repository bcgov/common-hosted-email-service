/**
 * @module dataSvc.spec
 *
 * Jest tests for the DataService class.
 * These tests require a configured connection to a Postgresql database.
 * It will run migrations before the tests, and then purge any test data when completed.
 *
 * @see DataService
 */
const helper = require('../common/helper');
const Knex = require('knex');
const { NotFoundError } = require('objection');
const uuidv4 = require('uuid/v4');

const { statusState, queueState } = require('../../src/components/state');
const stackpole = require('../../src/components/stackpole');
const utils = require('../../src/components/utils');

const DataConnection = require('../../src/services/dataConn');
const DataService = require('../../src/services/dataSvc');

const { deleteTransactionsByClient } = require('./dataUtils');

helper.logHelper();

const config = require('../../knexfile');

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

function expectNewMessage(trxnId, msgId, msg, email) {
  expect(msg.transactionId).toMatch(trxnId);
  expect(msg.messageId).toMatch(msgId);
  expect(msg.status).toMatch(statusState.ACCEPTED);
  expect(msg.createdAt).toBeTruthy();
  expect(msg.updatedAt).toBeTruthy();
  expect(msg.statusHistory).toHaveLength(1);
  expect(msg.statusHistory[0].messageId).toMatch(msg.messageId);
  expect(msg.statusHistory[0].status).toMatch(statusState.ACCEPTED);
  expect(msg.statusHistory[0].createdAt).toBeTruthy();
  expect(msg.statusHistory[0].updatedAt).toBeFalsy();
  expect(msg.email).toBeTruthy();
  expect(msg.sendResult).toBeFalsy();
  if (email) {
    expect(msg.delayTimestamp.toString()).toEqual(email.delayTS.toString());
    expect(msg.tag).toMatch(email.tag);
    expect(msg.email.to).toEqual(email.to);
  }
}

describe('dataService', () => {
  let knex;
  let dataService;
  const CLIENT = `unittesting-${new Date().toISOString()}`;

  beforeAll(async () => {
    knex = Knex(config);
    await knex.migrate.latest();
    const dataConnection = new DataConnection();
    const connectOK = await dataConnection.checkConnection();
    if (!connectOK) {
      throw Error('Error initializing dataService');
    }

    stackpole.register('createTransaction', async () => { return; });
    stackpole.register('updateStatus', async () => { return; });

    dataService = new DataService();
  });

  afterAll(async () => {
    // TODO: Find better way to allow connections to finish before cleanup
    await utils.wait(3000);
    await deleteTransactionsByClient(CLIENT);
    return knex.destroy();
  });

  afterEach(async () => {
    await deleteTransactionsByClient(CLIENT);
  });

  describe('constructor', () => {
    it('should return false on initializing data service without knex', async () => {
      const dataConnection = new DataConnection();
      dataConnection.knex = undefined;
      const connectOK = await dataConnection.checkConnection();
      expect(connectOK).toBeFalsy();
    });
  });

  describe('findMessagesByQuery', () => {
    const fn = (...args) => {
      return dataService.findMessagesByQuery(...args);
    };

    it('should throw a NotFoundError when nothing was found', async () => {
      await expect(fn(CLIENT)).rejects.toThrow(NotFoundError);
    });

    it('should throw a NotFoundError when the client is mismatched', async () => {
      const email = emails[0];
      await dataService.createTransaction(CLIENT, email);

      await expect(fn('garbage')).rejects.toThrow(NotFoundError);
    });

    it('should return a message when searching by messageId', async () => {
      const email = emails[0];
      const trxn = await dataService.createTransaction(CLIENT, email);

      const result = await fn(CLIENT, trxn.messages[0].messageId);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toHaveLength(1);
      expect(result[0].messageId).toMatch(trxn.messages[0].messageId);
    });

    it('should return a message when searching by status', async () => {
      const email = emails[0];
      const status = 'accepted';
      await dataService.createTransaction(CLIENT, email);

      const result = await fn(CLIENT, undefined, status);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toHaveLength(1);
      expect(result[0].status).toMatch(status);
    });

    it('should return a message when searching by tag', async () => {
      const email = emails[0];
      const tag = 'a tag value';
      await dataService.createTransaction(CLIENT, email);

      const result = await fn(CLIENT, undefined, undefined, tag);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toHaveLength(1);
      expect(result[0].tag).toMatch(tag);
    });

    it('should return a message when searching by transactionId', async () => {
      const email = emails[0];
      const { transactionId } = await dataService.createTransaction(CLIENT, email);

      const result = await fn(CLIENT, undefined, undefined, undefined, transactionId);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toHaveLength(1);
      expect(result[0].transactionId).toMatch(transactionId);
    });

    it('should return a message with multiple search criteria', async () => {
      const email = emails[0];
      const status = 'accepted';
      const tag = 'a tag value';
      const trxn = await dataService.createTransaction(CLIENT, email);

      const result = await fn(CLIENT, trxn.messages[0].messageId, status, tag, trxn.transactionId);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toHaveLength(1);
      expect(result[0].messageId).toMatch(trxn.messages[0].messageId);
      expect(result[0].status).toMatch(status);
      expect(result[0].tag).toMatch(tag);
      expect(result[0].transactionId).toMatch(trxn.transactionId);
    });

    it('should return multiple messages', async () => {
      const { transactionId } = await dataService.createTransaction(CLIENT, emails);

      const result = await fn(CLIENT, undefined, undefined, undefined, transactionId);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toHaveLength(2);
      expect(result[0].transactionId).toMatch(transactionId);
      expect(result[1].transactionId).toMatch(transactionId);
      expect(result[0].messageId).not.toMatch(result[1].messageId);
    });
  });

  describe('messageExists', () => {
    it('should return true when a message exists', async () => {
      const email = emails[0];
      const trxn = await dataService.createTransaction(CLIENT, email);

      const result = await dataService.messageExists(CLIENT, trxn.messages[0].messageId);

      expect(result).toBeTruthy();
    });

    it('should return false when the client is mismatched', async () => {
      const email = emails[0];
      const trxn = await dataService.createTransaction(CLIENT, email);

      const result = await dataService.messageExists('garbage', trxn.messages[0].messageId);

      expect(result).toBeFalsy();
    });

    it('should return false when a message does not exist', async () => {
      const result = await dataService.messageExists(CLIENT, uuidv4());

      expect(result).toBeFalsy();
    });
  });

  it('should error creating a transaction without client', async () => {
    const email = emails[0];

    await expect(dataService.createTransaction(undefined, email)).rejects.toThrow();
  });

  it('should error creating a transaction without email messages', async () => {
    const email = undefined;

    await expect(dataService.createTransaction(CLIENT, email)).rejects.toThrow();
  });

  it('should create a trxn for single email', async () => {
    const email = emails[0];
    const result = await dataService.createTransaction(CLIENT, email);
    expect(result).toBeTruthy();
    expect(result.transactionId).toBeTruthy();
    expect(result.client).toMatch(CLIENT);
    expect(result.createdAt).toBeTruthy();
    expect(result.updatedAt).toBeTruthy();
    expect(result.messages).toBeTruthy();
    expect(result.messages).toHaveLength(1);

    expectNewMessage(result.transactionId, result.messages[0].messageId, result.messages[0], email);

  });

  it('should create a trxn for email array', async () => {
    const compare = (a1, a2) =>
      (a1 = new Set(a1)) &&
      (a2 = new Set(a2)) &&
      a1.size === a2.size &&
      [...a1].every(v => a2.has(v));

    const result = await dataService.createTransaction(CLIENT, emails);
    expect(result).toBeTruthy();
    expect(result.transactionId).toBeTruthy();
    expect(result.client).toMatch(CLIENT);
    expect(result.createdAt).toBeTruthy();
    expect(result.updatedAt).toBeTruthy();
    expect(result.messages).toBeTruthy();
    expect(result.messages).toHaveLength(emails.length);

    emails.forEach((email, i) => {
      let matchedEmail = false;
      expectNewMessage(result.transactionId, result.messages[i].messageId, result.messages[i]);
      // can't be sure that the order of email processing is sequential
      result.messages.forEach(m => {
        if (m.tag === email.tag && compare(m.email.to, email.to) && m.delayTimestamp.toString() === email.delayTS.toString()) {
          matchedEmail = true;
        }
      });
      expect(matchedEmail).toBeTruthy();
    });
  });

  it('should update the status history', async () => {
    const email = emails[0];
    const result = await dataService.createTransaction(CLIENT, email);
    expect(result).toBeTruthy();

    // Add Enqueued State
    const msg = await dataService.updateStatus(CLIENT, result.messages[0].messageId, queueState.ENQUEUED);

    expect(msg.messageId).toMatch(result.messages[0].messageId);
    expect(msg.status).toMatch(statusState.PENDING);
    expect(msg.statusHistory).toHaveLength(2);
    expect(msg.statusHistory[1].status).toMatch(statusState.ACCEPTED);
    expect(msg.statusHistory[0].status).toMatch(statusState.PENDING);

    // Add Processing State (should yield no new status entry)
    const msg2 = await dataService.updateStatus(CLIENT, msg.messageId, queueState.ENQUEUED);
    expect(msg2.messageId).toMatch(msg.messageId);
    expect(msg2.status).toMatch(msg.status);
    expect(msg2.statusHistory).toHaveLength(2);
    // status history should come back in descending created order (last in, first out)
    expect(msg2.statusHistory[1].status).toMatch(statusState.ACCEPTED);
    expect(msg2.statusHistory[0].status).toMatch(statusState.PENDING);

    // Add Cancelled State (should yield new status entry)
    const newStatus = queueState.REMOVED;
    const msg3 = await dataService.updateStatus(CLIENT, msg.messageId, newStatus);
    expect(msg3.messageId).toMatch(msg.messageId);
    expect(msg3.status).toMatch(statusState.CANCELLED);
    expect(msg3.statusHistory).toHaveLength(3);
    // status history should come back in descending created order (last in, first out)
    expect(msg3.statusHistory[2].status).toMatch(statusState.ACCEPTED);
    expect(msg3.statusHistory[1].status).toMatch(statusState.PENDING);
    expect(msg3.statusHistory[0].status).toMatch(statusState.CANCELLED);
  });

  it('should error out on status update with bad message id', async () => {

    const messageId = uuidv4();
    const status = 'there is no message';

    await expect(dataService.updateStatus(CLIENT, messageId, status)).rejects.toThrow();
  });

  it('should error out on find transaction with bad id', async () => {
    const transactionId = uuidv4();
    await expect(dataService.readTransaction(CLIENT, transactionId)).rejects.toThrow();
  });

  it('should return a full transaction with valid id.', async () => {
    const email = emails[0];
    const result = await dataService.createTransaction(CLIENT, email);
    expect(result).toBeTruthy();

    const transactionId = result.transactionId;

    const transact = await dataService.readTransaction(CLIENT, transactionId);
    expect(transact).toBeTruthy();
    expect(transact.transactionId).toMatch(transactionId);
    expect(transact.client).toMatch(CLIENT);
    expect(transact.createdAt).toBeTruthy();
    expect(transact.updatedAt).toBeTruthy();
    expect(transact.messages).toBeTruthy();
    expect(transact.messages).toHaveLength(1);

    expectNewMessage(transact.transactionId, transact.messages[0].messageId, transact.messages[0], email);
  });

  it('should only read data created by the client.', async () => {
    const email = emails[0];
    const client1 = `client1-${uuidv4()}`;
    const result1 = await dataService.createTransaction(client1, email);
    expect(result1).toBeTruthy();

    const client2 = `client1-${uuidv4()}`;
    const result2 = await dataService.createTransaction(client2, email);
    expect(result2).toBeTruthy();

    const transactionId1 = result1.transactionId;
    const transactionId2 = result2.transactionId;

    const transact1 = await dataService.readTransaction(client1, transactionId1);
    expect(transact1).toBeTruthy();
    expect(transact1.transactionId).toMatch(transactionId1);
    expect(transact1.client).toMatch(client1);

    const transact2 = await dataService.readTransaction(client2, transactionId2);
    expect(transact2).toBeTruthy();
    expect(transact2.transactionId).toMatch(transactionId2);
    expect(transact2.client).toMatch(client2);

    const messageId1 = transact1.messages[0].messageId;
    const messageId2 = transact2.messages[0].messageId;

    const message1 = await dataService.readMessage(client1, messageId1);
    expect(message1).toBeTruthy();
    expect(message1.messageId).toMatch(messageId1);

    const message2 = await dataService.readMessage(client2, messageId2);
    expect(message2).toBeTruthy();
    expect(message2.messageId).toMatch(messageId2);

    const newStatus = queueState.REMOVED;
    const updated1 = await dataService.updateStatus(client1, messageId1, newStatus);
    expect(updated1.statusHistory).toHaveLength(2);

    const updated2 = await dataService.updateStatus(client2, messageId2, newStatus);
    expect(updated2.statusHistory).toHaveLength(2);

    const content1 = await dataService.deleteMessageEmail(client1, messageId1);
    expect(content1.email).toBeFalsy();

    const content2 = await dataService.deleteMessageEmail(client2, messageId2);
    expect(content2.email).toBeFalsy();

    const smtp1 = await dataService.updateMessageSendResult(client1, messageId1, {
      smtpMsgId: uuidv4(),
      response: 'response'
    });
    expect(smtp1.sendResult).toBeTruthy();

    const smpt2 = await dataService.updateMessageSendResult(client2, messageId2, {
      smtpMsgId: uuidv4(),
      response: 'response'
    });
    expect(smpt2.sendResult).toBeTruthy();

    await expect(dataService.readTransaction(client1, transactionId2)).rejects.toThrow();
    await expect(dataService.readTransaction(client2, transactionId1)).rejects.toThrow();

    await expect(dataService.readMessage(client1, messageId2)).rejects.toThrow();
    await expect(dataService.readMessage(client2, messageId1)).rejects.toThrow();

    await expect(dataService.updateStatus(client1, messageId2, 'bad')).rejects.toThrow();
    await expect(dataService.updateStatus(client2, messageId1, 'bad')).rejects.toThrow();

    await expect(dataService.deleteMessageEmail(client1, messageId2)).rejects.toThrow();
    await expect(dataService.deleteMessageEmail(client2, messageId1)).rejects.toThrow();

    await expect(dataService.updateMessageSendResult(client1, messageId2, {
      smtpMsgId: uuidv4(),
      response: 'response'
    })).rejects.toThrow();
    await expect(dataService.updateMessageSendResult(client2, messageId1, {
      smtpMsgId: uuidv4(),
      response: 'response'
    })).rejects.toThrow();

    deleteTransactionsByClient(client1);
    deleteTransactionsByClient(client2);
  });

  it('should error out on find message with bad id', async () => {
    const messageId = uuidv4();
    await expect(dataService.readMessage(CLIENT, messageId)).rejects.toThrow();
  });

  it('should return a full message with valid id.', async () => {
    const email = emails[0];
    const result = await dataService.createTransaction(CLIENT, email);
    expect(result).toBeTruthy();

    const messageId = result.messages[0].messageId;

    const msg = await dataService.readMessage(CLIENT, messageId);
    expectNewMessage(result.transactionId, messageId, msg, email);
  });

  it('should delete all records when delete by client called.', async () => {
    const email = emails[0];
    const client = 'unittesting-delete-by-client';
    const result = await dataService.createTransaction(client, email);
    expect(result).toBeTruthy();

    const transactionId = result.transactionId;
    const transact = await dataService.readTransaction(client, transactionId);
    expect(transact).toBeTruthy();
    expect(transact.client).toMatch(client);
    expect(transact.messages).toBeTruthy();
    expect(transact.messages).toHaveLength(1);

    // add in a queue record...
    const newStatus = queueState.ENQUEUED;
    const msg = await dataService.updateStatus(client, transact.messages[0].messageId, newStatus);
    expect(msg.statusHistory).toHaveLength(2);

    // ok, now let's delete...
    await deleteTransactionsByClient(client);
    // and we should error out trying to read our transaction... (not found)
    await expect(dataService.readTransaction(client, transactionId)).rejects.toThrow();
  });

  it('should set message email to null', async () => {
    const email = emails[0];
    const result = await dataService.createTransaction(CLIENT, email);
    expect(result).toBeTruthy();
    expect(result.messages[0].email).toBeTruthy();

    const msg = await dataService.deleteMessageEmail(CLIENT, result.messages[0].messageId);
    expect(msg.email).toBeFalsy();

  });

  it('should error set message email to null no message id.', async () => {
    await expect(dataService.deleteMessageEmail(CLIENT, undefined)).rejects.toThrow();
  });

  it('should set message send result to value', async () => {
    const email = emails[0];
    const result = await dataService.createTransaction(CLIENT, email);
    expect(result).toBeTruthy();
    expect(result.messages[0].email).toBeTruthy();

    const msg = await dataService.updateMessageSendResult(CLIENT, result.messages[0].messageId, {
      smtpMsgId: uuidv4(),
      response: 'some response'
    });
    expect(msg.sendResult).toBeTruthy();
    expect(msg.sendResult.smtpMsgId).toBeTruthy();
    expect(msg.sendResult.response).toBeTruthy();

  });

  it('should error set message result to null no message id.', async () => {
    await expect(dataService.updateMessageSendResult(CLIENT, undefined)).rejects.toThrow();
  });

});

