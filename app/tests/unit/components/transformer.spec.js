const helper = require('../../common/helper');
const transformer = require('../../../src/components/transformer');

helper.logHelper();

describe('toStatusResponse', () => {
  const nullPopulatedExpectations = result => {
    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(8);
    expect(result.createdTS).toBeNull();
    expect(result.delayTS).toBeNull();
    expect(result.msgId).toBeNull();
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
    expect(Object.keys(result)).toHaveLength(8);
    expect(result.createdTS).toBe(1571679721833);
  });

  it('should return an object with delayTS', () => {
    const result = transformer.toStatusResponse({
      delayTimestamp: '0'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(8);
    expect(result.delayTS).toBe(0);
  });

  it('should return an object with msgId', () => {
    const result = transformer.toStatusResponse({
      messageId: '00000000-0000-0000-0000-000000000000'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(8);
    expect(result.msgId).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should return an object with status', () => {
    const result = transformer.toStatusResponse({
      status: 'completed'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(8);
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
    expect(Object.keys(result)).toHaveLength(8);
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
    expect(Object.keys(result)).toHaveLength(8);
    expect(result.tag).toBe('tag');
  });

  it('should return an object with txId', () => {
    const result = transformer.toStatusResponse({
      transactionId: '00000000-0000-0000-0000-000000000000'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(8);
    expect(result.txId).toBe('00000000-0000-0000-0000-000000000000');
  });

  it('should return an object with updatedTS', () => {
    const result = transformer.toStatusResponse({
      updatedAt: '2019-10-21T17:42:01.833Z'
    });

    expect(result).toBeTruthy();
    expect(Object.keys(result)).toHaveLength(8);
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
