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
const uuidv4 = require('uuid/v4');

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

function expectNewMessage (trxnId, msgId, msg, email) {
  expect(msg.transactionId).toMatch(trxnId);
  expect(msg.messageId).toMatch(msgId);
  expect(msg.status).toMatch('accepted');
  expect(msg.createdAt).toBeTruthy();
  expect(msg.updatedAt).toBeTruthy();
  expect(msg.statusHistory).toHaveLength(1);
  expect(msg.statusHistory[0].messageId).toMatch(msg.messageId);
  expect(msg.statusHistory[0].status).toMatch('accepted');
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

describe('dataservice', () => {
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
    dataService = new DataService();
  });
  
  afterAll(async () => {
    await deleteTransactionsByClient(CLIENT);
    return knex.destroy();
  });
  
  it('should return false on initializing data service without knex', async () => {
    const dataConnection = new DataConnection();
    dataConnection.knex = undefined;
    const connectOK = await dataConnection.checkConnection();
    expect(connectOK).toBeFalsy();
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
  
  it('should update a status and queue history', async () => {
    const email = emails[0];
    const status = 'in the queue';
    const result = await dataService.createTransaction(CLIENT, email);
    expect(result).toBeTruthy();
    
    const msg = await dataService.updateStatus(CLIENT, result.messages[0].messageId, status);
    
    expect(msg.messageId).toMatch(result.messages[0].messageId);
    expect(msg.status).toMatch(status);
    expect(msg.statusHistory).toHaveLength(2);
    expect(msg.statusHistory[0].status).toMatch(status);
    expect(msg.queueHistory).toHaveLength(1);
    expect(msg.queueHistory[0].messageId).toMatch(msg.messageId);
    expect(msg.queueHistory[0].status).toMatch(status);
    
    // use the same status, should only add to queue history...
    const msg2 = await dataService.updateStatus(CLIENT, msg.messageId, status);
    expect(msg2.messageId).toMatch(msg.messageId);
    expect(msg2.status).toMatch(msg.status);
    expect(msg2.statusHistory).toHaveLength(2);
    // status history should come back in descending created order (last in, first out)
    expect(msg2.statusHistory[0].status).toMatch(status);
    expect(msg2.statusHistory[1].status).toMatch('accepted');
    expect(msg2.queueHistory).toHaveLength(2);
    // queue history should come back in descending created order (last in, first out)
    expect(msg2.queueHistory[0].messageId).toMatch(msg.messageId);
    expect(msg2.queueHistory[0].status).toMatch(status);
    expect(msg2.queueHistory[1].messageId).toMatch(msg.messageId);
    expect(msg2.queueHistory[1].status).toMatch(status);
    
    // use a new status, should add to status history too...
    const newStatus = 'this is new!';
    const msg3 = await dataService.updateStatus(CLIENT, msg.messageId, newStatus);
    expect(msg3.messageId).toMatch(msg.messageId);
    expect(msg3.status).toMatch(newStatus);
    expect(msg3.statusHistory).toHaveLength(3);
    // status history should come back in descending created order (last in, first out)
    expect(msg3.statusHistory[0].status).toMatch(newStatus);
    expect(msg3.statusHistory[1].status).toMatch(status);
    expect(msg3.statusHistory[2].status).toMatch('accepted');
    expect(msg3.queueHistory).toHaveLength(3);
    // queue history should come back in descending created order (last in, first out)
    expect(msg3.queueHistory[0].messageId).toMatch(msg.messageId);
    expect(msg3.queueHistory[0].status).toMatch(newStatus);
    expect(msg3.queueHistory[1].messageId).toMatch(msg.messageId);
    expect(msg3.queueHistory[1].status).toMatch(status);
    expect(msg3.queueHistory[2].messageId).toMatch(msg.messageId);
    expect(msg3.queueHistory[2].status).toMatch(status);
    
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
    
    const newStatus = 'a whole new status';
    const updated1 = await dataService.updateStatus(client1, messageId1, newStatus);
    expect(updated1.statusHistory).toHaveLength(2);
    expect(updated1.queueHistory).toHaveLength(1);
    
    const updated2 = await dataService.updateStatus(client2, messageId2, newStatus);
    expect(updated2.statusHistory).toHaveLength(2);
    expect(updated2.queueHistory).toHaveLength(1);
    
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
    const newStatus = 'a whole new status';
    const msg = await dataService.updateStatus(client, transact.messages[0].messageId, newStatus);
    expect(msg.statusHistory).toHaveLength(2);
    expect(msg.queueHistory).toHaveLength(1);
    
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

