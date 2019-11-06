const helper = require('../../common/helper');
const stackpole = require('../../../src/components/stackpole');

helper.logHelper();

describe('register', () => {
  const mockExecuteFn = jest.fn();
  const mockXformFn = jest.fn();

  afterEach(() => {
    mockExecuteFn.mockClear();
    mockXformFn.mockClear();
  });

  it('should register a method and call it with a transform', () => {
    stackpole.register('testOne', mockExecuteFn, mockXformFn);

    stackpole.testOne();

    expect(mockExecuteFn).toHaveBeenCalledTimes(1);
    expect(mockXformFn).toHaveBeenCalledTimes(1);

  });

  it('should register a method and call it without a transform', () => {
    stackpole.register('testTwo', mockExecuteFn);

    stackpole.testTwo();

    expect(mockExecuteFn).toHaveBeenCalledTimes(1);
    expect(mockXformFn).toHaveBeenCalledTimes(0);

  });

  it('should register a method and do nothing if not functions', () => {
    stackpole.register('testThree', 'not an execute function', 'this is not valid');

    stackpole.testThree();

    expect(mockExecuteFn).toHaveBeenCalledTimes(0);
    expect(mockXformFn).toHaveBeenCalledTimes(0);

  });

  it('should register a method and call it, ignoring invalid transform', () => {
    stackpole.register('testFour', mockExecuteFn, 'this is not valid');

    stackpole.testFour();

    expect(mockExecuteFn).toHaveBeenCalledTimes(1);
    expect(mockXformFn).toHaveBeenCalledTimes(0);

  });

  it('should register a method and call it and call multiple executors', () => {
    stackpole.register('testFive', [mockExecuteFn, mockExecuteFn, mockExecuteFn], mockXformFn);

    stackpole.testFive();

    expect(mockExecuteFn).toHaveBeenCalledTimes(3);
    expect(mockXformFn).toHaveBeenCalledTimes(1);

  });

  it('should register a method and call it gracefully when executors error', () => {
    stackpole.register('testSix', jest.fn().mockImplementation(() => {throw new Error('bad');}), mockXformFn);

    stackpole.testSix();

    expect(mockXformFn).toHaveBeenCalledTimes(1);

  });

  it('should register a method and call it gracefully when executors error', () => {
    stackpole.register('testSeven', jest.fn().mockImplementation(() => {throw new Error('bad');}));

    stackpole.testSeven();

  });

  it('should register a method and call it handle non-array transforms.', () => {
    stackpole.register('testEight', mockExecuteFn, () => {return 'string';});

    stackpole.testEight();
    expect(mockExecuteFn).toHaveBeenCalledTimes(1);

  });

  it('should register a method and call it gracefully when executors error after transform', () => {
    stackpole.register('testNine', jest.fn().mockImplementation(() => {throw new Error('bad');}), () => {return 'string';});

    expect(() => stackpole.testNine()).not.toThrow();
  });

});
