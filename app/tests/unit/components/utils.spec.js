const helper = require('../../common/helper');
const utils = require('../../../src/components/utils');

helper.logHelper();

describe('calculateDelayMS', () => {
  it('should return an appropriate delay difference', () => {
    const delayTS = Date.now() + 60000;

    const result = utils.calculateDelayMS(delayTS);

    expect(result).toBeTruthy();
    expect(result).toBeGreaterThan(59900);
    expect(result).toBeLessThan(60100);
  });

  it('should return 0 when delay is in the past', () => {
    const delayTS = Date.now() - 60000;
    const result = utils.calculateDelayMS(delayTS);

    expect(result).toBeFalsy();
    expect(result).toBe(0);
  });
});

describe('calculateDelayTS', () => {
  it('should return the correct delayed UTC time', () => {
    const delay = 60000;
    const result = utils.calculateDelayTS(delay, Date.now());

    expect(result).toBeTruthy();
    expect(result).toBeGreaterThan(Date.now() + 59900);
    expect(result).toBeLessThan(Date.now() + 60100);
  });

  it('should return 0 when delay is in the past', () => {
    const delayTS = Date.now() - 60000;
    const result = utils.calculateDelayMS(delayTS);

    expect(result).toBeFalsy();
    expect(result).toBe(0);
  });
});

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

describe('wait', () => {
  it('should return after a period of time', () => {
    const result = utils.wait(200);

    expect(result).resolves.toBeTruthy();
  });
});
