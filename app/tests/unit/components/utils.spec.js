const utils = require('../../../src/components/utils');

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

describe('dropUndefinedObject', () => {
  const obj = {
    foo: undefined,
    bar: 'baz',
    herp: {
      lol: 'yes',
      bad: null,
      uh: undefined
    }
  };

  it('should only drop undefined properties', () => {
    const result = utils.dropUndefinedObject(obj);

    expect(result).toBeTruthy();
    expect(result.foo).toBeUndefined();
    expect(result.bar).toMatch('baz');
    expect(Object.keys(result).length).toEqual(2);

    expect(result.herp).toBeTruthy();
    expect(result.herp.lol).toMatch('yes');
    expect(result.herp.bad).toBeNull();
    expect(result.herp.uh).toBeUndefined();
    expect(Object.keys(result.herp).length).toEqual(2);
  });
});

describe('filterUndefinedAndEmptyArray', () => {
  const obj = {
    foo: undefined,
    bar: [],
    baz: [
      'herp'
    ],
    derp: 'flerp',
    whoops: null
  };

  it('should drop undefined properties', () => {
    const result = utils.filterUndefinedAndEmptyArray(obj);

    expect(result).toBeTruthy();
    expect(result.foo).toBeUndefined();
    expect(result.whoops).toBeUndefined();
    expect(result.derp).toMatch('flerp');
    expect(Object.keys(result).length).toEqual(2);
  });

  it('should drop empty array properties', () => {
    const result = utils.filterUndefinedAndEmptyArray(obj);

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
  it('should return after a period of time', async () => {
    const result = await utils.wait(200);

    expect(result).toBeUndefined();
  });
});
