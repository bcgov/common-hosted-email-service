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
