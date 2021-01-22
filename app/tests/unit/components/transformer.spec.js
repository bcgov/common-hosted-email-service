const moment = require('moment');

const helper = require('../../common/helper');
const transformer = require('../../../src/components/transformer');

helper.logHelper();

describe('toStatusResponse', () => {
  const nullPopulatedExpectations = result => {
    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(9);
    expect(result.createdTS).toBeNull();
    expect(result.delayTS).toBeNull();
    expect(result.msgId).toBeNull();
    expect(result.smtpResponse).toBeNull();
    expect(result.status).toBeNull();
    expect(Array.isArray(result.statusHistory)).toBeTruthy();
    expect(result.statusHistory).toHaveLength(0);
    expect(result.tag).toBeNull();
    expect(result.txId).toBeNull();
    expect(result.updatedTS).toBeNull();
  };

  it('should return a null populated object with a number', () => {
    const result = transformer.toStatusResponse(3);

    nullPopulatedExpectations(result);
  });

  it('should return a null populated object with a string', () => {
    const result = transformer.toStatusResponse('string');

    nullPopulatedExpectations(result);
  });

  it('should return a null populated object with an empty array', () => {
    const result = transformer.toStatusResponse([]);

    nullPopulatedExpectations(result);
  });

  it('should return a null populated object with an empty object', () => {
    const result = transformer.toStatusResponse({});

    nullPopulatedExpectations(result);
  });

  it('should return an object with createdTS', () => {
    const result = transformer.toStatusResponse({
      createdAt: '2019-10-21T17:42:01.833Z'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(9);
    expect(result.createdTS).toBe(1571679721833);
  });

  it('should return an object with delayTS', () => {
    const result = transformer.toStatusResponse({
      delayTimestamp: '0'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(9);
    expect(result.delayTS).toBe(0);
  });

  it('should return an object with msgId', () => {
    const result = transformer.toStatusResponse({
      messageId: '00000000-0000-0000-0000-000000000000'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(9);
    expect(result.msgId).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should return an object with smtpResponse', () => {
    const smtp = '{"smtpMsgId": "<00000000-0000-0000-0000-000000000000@gov.bc.ca>","response": "250 2.6.0 <00000000-0000-0000-0000-000000000000@gov.bc.ca> [InternalId=abc, Hostname=E6PEDG06.idir.BCGOV] 4596 bytes in 0.105, 42.525 KB/sec Queued mail for delivery"}';
    const result = transformer.toStatusResponse({
      sendResult: smtp
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(9);
    expect(result.smtpResponse).toBe(smtp);
  });


  it('should return an object with status', () => {
    const result = transformer.toStatusResponse({
      status: 'completed'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(9);
    expect(result.status).toBe('completed');
  });

  it('should return an object with statusHistory array', () => {
    const historyObj = {
      createdAt: '2019-10-21T17:42:01.833Z',
      description: 'text',
      status: 'stuff'
    };

    const result = transformer.toStatusResponse({
      statusHistory: [
        historyObj,
        historyObj
      ]
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(9);
    expect(result.statusHistory).toHaveLength(2);
    expect(result.statusHistory[0].description).toBe('text');
    expect(result.statusHistory[0].status).toBe('stuff');
    expect(result.statusHistory[0].timestamp).toBe(1571679721833);
  });

  it('should return an object with tag', () => {
    const result = transformer.toStatusResponse({
      tag: 'tag'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(9);
    expect(result.tag).toBe('tag');
  });

  it('should return an object with txId', () => {
    const result = transformer.toStatusResponse({
      transactionId: '00000000-0000-0000-0000-000000000000'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(9);
    expect(result.txId).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should return an object with updatedTS', () => {
    const result = transformer.toStatusResponse({
      updatedAt: '2019-10-21T17:42:01.833Z'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(9);
    expect(result.updatedTS).toBe(1571679721833);
  });
});

describe('toTransactionResponse', () => {
  it('should return a null populated object with a number', () => {
    const result = transformer.toTransactionResponse(3);

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(2);
    expect(result.txId).toBeNull();
    expect(result.messages).toBeTruthy();
    expect(Array.isArray(result.messages)).toBeTruthy();
    expect(result.messages).toHaveLength(0);
  });

  it('should return a null populated object with a string', () => {
    const result = transformer.toTransactionResponse('string');

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(2);
    expect(result.txId).toBeNull();
    expect(result.messages).toBeTruthy();
    expect(Array.isArray(result.messages)).toBeTruthy();
    expect(result.messages).toHaveLength(0);
  });

  it('should return a null populated object with an empty array', () => {
    const result = transformer.toTransactionResponse([]);

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(2);
    expect(result.txId).toBeNull();
    expect(result.messages).toBeTruthy();
    expect(Array.isArray(result.messages)).toBeTruthy();
    expect(result.messages).toHaveLength(0);
  });

  it('should return a null populated object with an empty object', () => {
    const result = transformer.toTransactionResponse({});

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(2);
    expect(result.txId).toBeNull();
    expect(result.messages).toBeTruthy();
    expect(Array.isArray(result.messages)).toBeTruthy();
    expect(result.messages).toHaveLength(0);
  });

  it('should return an object with an empty message', () => {
    const result = transformer.toTransactionResponse({
      messages: [{}],
      transactionId: '00000000-0000-0000-0000-000000000000'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(2);
    expect(result.txId).toBe('00000000-0000-0000-0000-000000000000');
    expect(result.messages).toBeTruthy();
    expect(Array.isArray(result.messages)).toBeTruthy();
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].msgId).toBeNull();
    expect(result.messages[0].to).toBeNull();
  });

  it('should return an object with all properties populated', () => {
    const result = transformer.toTransactionResponse({
      messages: [
        {
          email: {
            to: 'foo@example.com'
          },
          messageId: '00000000-0000-0000-0000-000000000001'
        },
        {
          email: {
            to: 'bar@example.com'
          },
          messageId: '00000000-0000-0000-0000-000000000002'
        }
      ],
      transactionId: '00000000-0000-0000-0000-000000000000'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(2);
    expect(result.txId).toBe('00000000-0000-0000-0000-000000000000');
    expect(result.messages).toBeTruthy();
    expect(Array.isArray(result.messages)).toBeTruthy();
    expect(result.messages).toHaveLength(2);
    expect(result.messages[0].msgId).toBe('00000000-0000-0000-0000-000000000001');
    expect(result.messages[0].to).toBe('foo@example.com');
  });
});

describe('transactionToStatistics', () => {
  it('should return an empty list with null client parameter', () => {
    const result = transformer.transactionToStatistics(null, { transactionId: 1, messages: [] });

    expect(result).toBeTruthy();
    expect(result).toHaveLength(0);
  });

  it('should return an empty list with null transaction parameter', () => {
    const result = transformer.transactionToStatistics('client', null);

    expect(result).toBeTruthy();
    expect(result).toHaveLength(0);
  });

  it('should return an empty list with a transaction with no messages ', () => {
    const result = transformer.transactionToStatistics('client', { transactionId: 1, messages: null });

    expect(result).toBeTruthy();
    expect(result).toHaveLength(0);
  });

  it('should return a list of statistics', () => {
    const createdAt = moment.utc().toDate();
    const delay = moment.utc().add(7, 'd');
    const result = transformer.transactionToStatistics('testclient', {
      messages: [
        {
          email: {
            to: 'foo@example.com'
          },
          messageId: '00000000-0000-0000-0000-000000000001',
          createdAt: createdAt,
          status: 'phony',
          delayTimestamp: delay.valueOf()
        },
        {
          email: {
            to: 'bar@example.com'
          },
          messageId: '00000000-0000-0000-0000-000000000002',
          createdAt: createdAt,
          status: 'phony',
          delayTimestamp: moment.utc().subtract(7, 'd').valueOf()
        }
      ],
      transactionId: '00000000-0000-0000-0000-000000000000'
    });

    expect(result).toBeTruthy();
    expect(result).toHaveLength(2);

    expect(result[0].transactionId).toBe('00000000-0000-0000-0000-000000000000');
    expect(result[0].operation).toBe('TRANSACTION_CREATE');
    expect(result[0].messageId).toBe('00000000-0000-0000-0000-000000000001');
    expect(result[0].status).toBe('phony');
    expect(result[0].timestamp).toBe(createdAt);
    expect(moment(result[0].delay).toISOString()).toMatch(delay.toISOString());

    expect(result[1].transactionId).toBe('00000000-0000-0000-0000-000000000000');
    expect(result[1].operation).toBe('TRANSACTION_CREATE');
    expect(result[1].messageId).toBe('00000000-0000-0000-0000-000000000002');
    expect(result[1].status).toBe('phony');
    expect(result[1].timestamp).toBe(createdAt);
    expect(result[1].delay).toBe(null);
  });
});

describe('messageToStatistics', () => {
  it('should return an empty list with null client parameter', () => {
    const result = transformer.messageToStatistics(null, {});

    expect(result).toBeTruthy();
    expect(result).toHaveLength(0);
  });

  it('should return an empty list with null transaction parameter', () => {
    const result = transformer.messageToStatistics('client', null);

    expect(result).toBeTruthy();
    expect(result).toHaveLength(0);
  });

  it('should return a one statistics with delay', () => {
    const updatedAt = moment.utc().toDate();
    const delay = moment.utc().add(7, 'd').valueOf();
    const result = transformer.messageToStatistics('testclient', {
      email: {
        to: 'foo@example.com'
      },
      messageId: '00000000-0000-0000-0000-000000000001',
      updatedAt: updatedAt,
      status: 'phony',
      delayTimestamp: delay,
      transactionId: '00000000-0000-0000-0000-000000000000'
    });

    expect(result).toBeTruthy();
    expect(result).toHaveLength(1);

    expect(result[0].transactionId).toBe('00000000-0000-0000-0000-000000000000');
    expect(result[0].operation).toBe('STATUS_UPDATE');
    expect(result[0].messageId).toBe('00000000-0000-0000-0000-000000000001');
    expect(result[0].status).toBe('phony');
    expect(result[0].timestamp).toBe(updatedAt);
    expect(result[0].delay.toString()).toMatch(moment(delay).toString());
  });

  it('should return a one statistics without a delay', () => {
    const updatedAt = moment.utc().toDate();
    const delay = moment.utc().subtract(7, 'd').valueOf();
    const result = transformer.messageToStatistics('testclient', {
      email: {
        to: 'foo@example.com'
      },
      messageId: '00000000-0000-0000-0000-000000000001',
      updatedAt: updatedAt,
      status: 'phony',
      delayTimestamp: delay,
      transactionId: '00000000-0000-0000-0000-000000000000'
    });

    expect(result).toBeTruthy();
    expect(result).toHaveLength(1);

    expect(result[0].transactionId).toBe('00000000-0000-0000-0000-000000000000');
    expect(result[0].operation).toBe('STATUS_UPDATE');
    expect(result[0].messageId).toBe('00000000-0000-0000-0000-000000000001');
    expect(result[0].status).toBe('phony');
    expect(result[0].timestamp).toBe(updatedAt);
    expect(result[0].delay).toBe(null);
  });
});

describe('mailApiToStatistics', () => {
  it('should return an empty list with null parameter', () => {
    const result = transformer.mailApiToStatistics(null);

    expect(result).toBeTruthy();
    expect(result).toHaveLength(0);
  });

  it('should return an empty list with empty parameter', () => {
    const result = transformer.mailApiToStatistics('');

    expect(result).toBeTruthy();
    expect(result).toHaveLength(0);
  });

  it('should return an empty list with bad parameter', () => {
    const result = transformer.mailApiToStatistics('not enough tokens');

    expect(result).toBeTruthy();
    expect(result).toHaveLength(0);
  });

  it('should return a one statistic for proper string', () => {
    const clientName = 'CLIENT_NAME';
    const op = 'MAIL';
    const txId = '00000000-0000-0000-0000-000000000000';
    const msgId = '00000000-0000-0000-0000-000000000001';
    const ts = moment.utc().toDate();
    const result = transformer.mailApiToStatistics(`${clientName} ${op} ${txId} ${msgId} ${ts.valueOf()}`);

    expect(result).toBeTruthy();
    expect(result).toHaveLength(1);

    expect(result[0].client).toBe(clientName);
    expect(result[0].operation).toBe(op);
    expect(result[0].transactionId).toBe(txId);
    expect(result[0].messageId).toBe(msgId);
    expect(result[0].status).toBe('-');
    expect(result[0].timestamp).toStrictEqual(ts);
    expect(result[0].delay).toBe(null);
  });

  it('should return a two statistic for multi-messages', () => {
    const clientName = 'CLIENT_NAME';
    const op = 'MAIL';
    const txId = '00000000-0000-0000-0000-000000000000';
    const msgId = '00000000-0000-0000-0000-000000000001';
    const msgId2 = '00000000-0000-0000-0000-000000000002';
    const ts = moment.utc().toDate();
    const result = transformer.mailApiToStatistics(`${clientName} ${op} ${txId} ${msgId},${msgId2} ${ts.valueOf()}`);

    expect(result).toBeTruthy();
    expect(result).toHaveLength(2);

    expect(result[0].client).toBe(clientName);
    expect(result[0].operation).toBe(op);
    expect(result[0].transactionId).toBe(txId);
    expect(result[0].messageId).toBe(msgId);
    expect(result[0].status).toBe('-');
    expect(result[0].timestamp).toStrictEqual(ts);
    expect(result[0].delay).toBe(null);

    expect(result[1].client).toBe(clientName);
    expect(result[1].operation).toBe(op);
    expect(result[1].transactionId).toBe(txId);
    expect(result[1].messageId).toBe(msgId2);
    expect(result[1].status).toBe('-');
    expect(result[1].timestamp).toStrictEqual(ts);
    expect(result[1].delay).toBe(null);
  });
});
