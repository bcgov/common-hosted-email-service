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
