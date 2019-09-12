const config = require('config');
const log = require('npmlog');

const utils = require('../../../src/components/utils');

log.level = config.get('server.logLevel');

describe('filterUndefinedAndEmpty', () => {
  const obj = {
    foo: undefined,
    bar: [],
    baz: [
      'herp'
    ],
    derp: 'flerp'
  };

  it('should drop undefined properties', () => {
    const result = utils.filterUndefinedAndEmpty(obj);

    expect(result).toBeTruthy();
    expect(result.foo).toBeUndefined();
    expect(result.derp).toMatch('flerp');
    expect(Object.keys(result).length).toEqual(2);
  });

  it('should drop empty array properties', () => {
    const result = utils.filterUndefinedAndEmpty(obj);

    expect(result).toBeTruthy();
    expect(result.bar).toBeUndefined();
    expect(result.baz.length).toEqual(1);
    expect(Object.keys(result).length).toEqual(2);
  });
});

describe('prettyStringify', () => {
  const obj = {
    foo: 'bar'
  };

  it('should return a formatted json string with 2 space indent', () => {
    const result = utils.prettyStringify(obj);

    expect(result).toBeTruthy();
    expect(result).toEqual('{\n  "foo": "bar"\n}');
  });

  it('should return a formatted json string with 4 space indent', () => {
    const result = utils.prettyStringify(obj, 4);

    expect(result).toBeTruthy();
    expect(result).toEqual('{\n    "foo": "bar"\n}');
  });
});

describe('toPascalCase', () => {
  it('should return a string', () => {
    const string = 'test foo bar';
    const result = utils.toPascalCase(string);

    expect(result).toBeTruthy();
    expect(result).toMatch(/[A-Z][a-z]+(?:[A-Z][a-z]+)*/);
  });
});

describe('validateContexts', () => {
  it('should return true for an array of valid contexts', () => {
    const validObj = [
      {
        to: ['foo@bar.com'],
        context: { test: '123' }
      },
      {
        to: ['foo@bar.com'],
        cc: ['baz@bar.com'],
        bcc: ['1@2.com', '3@4.com'],
        context: { 'test': '123', 'this_is_a_valid_key_from_json_123': 'pass', 'subObject': {good: 'good key name'} }
      }];
    const result = utils.validateContexts(validObj);

    expect(result).toBeTruthy();
  });

  it('should throw if to is missing in a context', () => {
    // For this one have a valid context first and invalid second, to check the .every is working
    const invalidObj = [
      {
        to: ['foo@bar.com'],
        context: { test: '123' }
      },
      {
        context: { test: '123' }
      }];

    expect(() => utils.validateContexts(invalidObj)).toThrow('Invalid value `to`');
  });

  it('should throw if to is not an array in a context', () => {
    const invalidObj = [
      {
        to: 'foo@bar.com',
        context: { test: '123' }
      }];

    expect(() => utils.validateContexts(invalidObj)).toThrow('Invalid value `to`');
  });

  it('should throw if cc is not an array in a context', () => {
    const invalidObj = [
      {
        to: ['foo@bar.com'],
        cc: 'baz@bar.com',
        bcc: ['fizz@bar.com'],
        context: { test: '123' }
      }];

    expect(() => utils.validateContexts(invalidObj)).toThrow('Invalid value `cc`');
  });

  it('should throw if bcc is not an array in a context', () => {
    const invalidObj = [
      {
        to: ['foo@bar.com'],
        cc: ['fizz@bar.com'],
        bcc: 'baz@bar.com',
        context: { test: '123' }
      }];

    expect(() => utils.validateContexts(invalidObj)).toThrow('Invalid value `bcc`');
  });

  it('should throw if context is not an object in a context', () => {
    const invalidObj = [
      {
        to: ['foo@bar.com'],
        context: 123
      }];

    expect(() => utils.validateContexts(invalidObj)).toThrow('Invalid value `context`');
  });

  it('should throw if context field is not an Alpha Numeric or Underscore', () => {
    const invalidObj = [
      {
        'to': ['foo@bar.com'],
        'context': {
          'a1_&': 'bad key'
        }
      }];

    expect(() => utils.validateContexts(invalidObj)).toThrow('Invalid field name (a1_&) in `context`.  Only alphanumeric characters and underscore allowed.');
  });

  it('should throw if context subobject field is not an Alpha Numeric of Underscore', () => {
    const invalidObj = [
      {
        'to': ['foo@bar.com'],
        'context': {
          'subObject': {
            'b2_&*(*&(*&)(* )()((* ab_cd_1_2_3': 'bad key'
          }
        }
      }];

    expect(() => utils.validateContexts(invalidObj)).toThrow('Invalid field name (b2_&*(*&(*&)(* )()((* ab_cd_1_2_3) in `context`.  Only alphanumeric characters and underscore allowed.');
  });
});
