const helper = require('../../common/helper');
const transformer = require('../../../src/components/transformer');

helper.logHelper();

describe('toStatusResponse', () => {
  it('should return an empty object if all properties are undefined', () => {
    const result = transformer.toStatusResponse({});

    expect(result).toBeTruthy();
    expect(Object.keys(result).length).toBe(0);
  });

  it('should return an object with createdTimestamp', () => {
    const result = transformer.toStatusResponse({
      createdAt: '2019-10-21T17:42:01.833Z'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result).length).toBe(1);
    expect(result.createdTimestamp).toBe(1571679721833);
  });

  it('should return an object with delayTS', () => {
    const result = transformer.toStatusResponse({
      delayTimestamp: '0'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result).length).toBe(1);
    expect(result.delayTS).toBe(0);
  });

  it('should return an object with msgId', () => {
    const result = transformer.toStatusResponse({
      messageId: '00000000-0000-0000-0000-000000000000'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result).length).toBe(1);
    expect(result.msgId).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should return an object with status', () => {
    const result = transformer.toStatusResponse({
      status: 'completed'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result).length).toBe(1);
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
    expect(Object.keys(result).length).toBe(1);
    expect(result.statusHistory.length).toBe(2);
    expect(result.statusHistory[0].description).toBe('text');
    expect(result.statusHistory[0].status).toBe('stuff');
    expect(result.statusHistory[0].timestamp).toBe(1571679721833);
  });

  it('should return an object with tag', () => {
    const result = transformer.toStatusResponse({
      tag: 'tag'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result).length).toBe(1);
    expect(result.tag).toBe('tag');
  });

  it('should return an object with txId', () => {
    const result = transformer.toStatusResponse({
      transactionId: '00000000-0000-0000-0000-000000000000'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result).length).toBe(1);
    expect(result.txId).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should return an object with updatedTimestamp', () => {
    const result = transformer.toStatusResponse({
      updatedAt: '2019-10-21T17:42:01.833Z'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result).length).toBe(1);
    expect(result.updatedTimestamp).toBe(1571679721833);
  });
});

describe('toTransactionResponse', () => {
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
    expect(Object.keys(result).length).toBe(2);
    expect(result.txId).toBe('00000000-0000-0000-0000-000000000000');
    expect(result.messages).toBeTruthy();
    expect(result.messages.length).toBe(2);
    expect(result.messages[0].msgId).toBe('00000000-0000-0000-0000-000000000001');
    expect(result.messages[0].to).toBe('foo@example.com');
  });
});
