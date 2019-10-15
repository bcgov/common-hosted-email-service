const helper = require('../../common/helper');
const merge = require('../../../src/components/merge');

helper.logHelper();

// Constant Fixtures
const body = 'body {{ foo }}';
const subject = 'subject {{ foo }}';

// Object Fixtures
const contextEntry = {
  to: [
    'bar@example.com'
  ],
  cc: [
    'baz@example.com'
  ],
  bcc: [
    'foo@example.com',
    'fizz@example.com'
  ],
  context: {
    foo: 'test'
  },
  delayTS: 1
};

const template = {
  attachments: undefined,
  bodyType: 'text',
  body: body,
  'contexts': [
    contextEntry,
    contextEntry
  ],
  encoding: 'utf-8',
  from: 'foo@example.com',
  priority: 'normal',
  subject: subject
};

jest.mock('../../../src/services/dataSvc', () => {
  return jest.fn().mockImplementation(() => {
    return {
      create: async (client, msg) => {
        if (client === 'throw error') {
          throw Error();
        }
        return {
          'transactionId': '8300b0e9-51dc-4280-a769-cc4fa8c124a0',
          'client': client,
          'createdAt': '2019-10-14T23:08:44.199Z',
          'updatedAt': '2019-10-14T23:08:44.199Z',
          'messages': [
            {
              'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
              'transactionId': '8300b0e9-51dc-4280-a769-cc4fa8c124a0',
              'tag': msg.tag,
              'delayTimestamp': null,
              'status': 'accepted',
              'createdAt': '2019-10-14T23:08:44.199Z',
              'updatedAt': '2019-10-14T23:08:44.199Z',
              'statusHistory': [
                {
                  'statusId': 6,
                  'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                  'status': 'accepted',
                  'description': null,
                  'createdAt': '2019-10-14T23:08:44.199Z'
                }
              ],
              'content': {
                'contentId': 2,
                'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                'email': {
                  'attachments': [],
                  'bcc': [],
                  'bodyType': msg.bodyType,
                  'body': msg.body,
                  'cc': [],
                  'encoding': 'utf-8',
                  'from': msg.from,
                  'priority': msg.priority,
                  'to': msg.to,
                  'subject': msg.subject,
                  'tag': msg.tag
                },
                'createdAt': '2019-10-14T23:08:44.199Z',
                'updatedAt': '2019-10-14T23:08:44.199Z'
              },
              'queueHistory': []
            }
          ]
        };
      },
      readTransaction: async (id) => {
        return {
          'transactionId': id,
          'client': 'MSSC_SERVICE_CLIENT',
          'createdAt': '2019-10-14T23:08:44.199Z',
          'updatedAt': '2019-10-14T23:08:44.199Z',
          'messages': [
            {
              'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
              'transactionId': id,
              'tag': 'a tag value',
              'delayTimestamp': null,
              'status': 'enqueued',
              'createdAt': '2019-10-14T23:08:44.199Z',
              'updatedAt': '2019-10-14T23:09:15.477Z',
              'statusHistory': [
                {
                  'statusId': 6,
                  'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                  'status': 'accepted',
                  'description': null,
                  'createdAt': '2019-10-14T23:08:44.199Z'
                },
                {
                  'statusId': 7,
                  'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                  'status': 'enqueued',
                  'description': null,
                  'createdAt': '2019-10-14T23:09:15.450Z'
                }
              ],
              'content': {
                'contentId': 2,
                'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                'email': {
                  'attachments': [],
                  'bcc': [],
                  'bodyType': 'text',
                  'body': 'body',
                  'cc': [],
                  'encoding': 'utf-8',
                  'from': 'email@email.com',
                  'priority': 'normal',
                  'to': ['email@email.com'],
                  'subject': 'subject',
                  'tag': 'tag'
                },
                'createdAt': '2019-10-14T23:08:44.199Z',
                'updatedAt': '2019-10-14T23:08:44.199Z'
              },
              'queueHistory': [
                {
                  'queueId': 5,
                  'externalQueueId': '863346a3-30ec-478d-bf72-00b4cc1b78c4',
                  'messageId': '7106dc49-8316-4c0e-a984-a896aff98c19',
                  'status': 'enqueued',
                  'description': null,
                  'createdAt': '2019-10-14T23:09:15.450Z'
                }
              ]
            }
          ]
        };
      }
      
    };
  });
});

jest.mock('../../../src/services/emailSvc', () => {
  return jest.fn().mockImplementation(() => {
    return {
      send: async (msg, ethereal = false) => {
        if (msg.tag === 'throw error') {
          throw Error();
        }
        if (ethereal) {
          return 'https://example.com';
        } else {
          return {};
        }
      }
    };
  });
});

jest.mock('../../../src/services/queueSvc', () => {
  return jest.fn().mockImplementation(() => {
    return {
      // eslint-disable-next-line no-unused-vars
      enqueue: async (message, opts = {}) => {
        return '2bb7b7c3-d7bb-4b46-bcde-527b394270d7';
      }
    };
  });
});

describe('mergeMailEthereal', () => {
  
  it('should yield an array of Ethereal email urls', async () => {
    
    const result = await merge.mergeMailEthereal(template);
    expect(result).toBeTruthy();
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual('https://example.com');
  });
  
  it('should throw an error if any sending failed', async () => {
    template.contexts[1].tag = 'throw error';
    await expect(merge.mergeMailEthereal(template)).rejects.toThrow();
  });
});

describe('mergeMailSmtp', () => {
  
  it('should yield an array of nodemailer result objects', async () => {
    const result = await merge.mergeMailSmtp('merge unittest client', template);
    expect(result).toBeTruthy();
    expect(result.txId).toBeTruthy();
    expect(result.messages).toBeTruthy();
  });
  
  it('should throw an error if any sending failed', async () => {
    await expect(merge.mergeMailSmtp('throw error', template)).rejects.toThrow();
  });
});

describe('mergeTemplate', () => {
  it('should yield an array of message objects', () => {
    const result = merge.mergeTemplate(template);
    expect(result).toBeTruthy();
    expect(result).toHaveLength(2);
    expect(result[0].body).toMatch('body test');
    expect(result[0].to).toBeTruthy();
    expect(result[0].subject).toMatch('subject test');
  });
});

describe('renderMerge', () => {
  const str = 'Hello {{ foo }}';
  const context = {
    foo: 'test'
  };
  
  it('should yield a rendered merge string', () => {
    const result = merge.renderMerge(str, context);
    expect(result).toBeTruthy();
    expect(result).toMatch('Hello test');
  });
  
  it('should throw an error on an unrecognized dialect', () => {
    const dialect = 'badDialect';
    const result = () => merge.renderMerge(str, context, dialect);
    expect(result).toBeTruthy();
    expect(result).toThrow(`Dialect ${dialect} not supported`);
  });
});
