const helper = require('../../common/helper');
const { queueState, statusState, queueToStatus } = require('../../../src/components/state');

helper.logHelper();

describe('queueState', () => {
  it('should have the correct number of defined states', () => {
    expect(Object.keys(queueState)).toHaveLength(8);
  });

  it('should be read only', () => {
    expect(Object.isFrozen(queueState)).toBeTruthy();
  });
});

describe('statusState', () => {
  it('should have the correct number of defined states', () => {
    expect(Object.keys(statusState)).toHaveLength(6);
  });

  it('should be read only', () => {
    expect(Object.isFrozen(statusState)).toBeTruthy();
  });
});

describe('queueToStatus', () => {
  it('should throw when queueStatus is not valid', () => {
    expect(() => queueToStatus('')).toThrow('NotValidStatus');
  });

  it('should map queue accepted to accepted', () => {
    const result = queueToStatus(queueState.ACCEPTED);

    expect(result).toBeTruthy();
    expect(result).toMatch(statusState.ACCEPTED);
  });

  it('should map queue completed to status completed', () => {
    const result = queueToStatus(queueState.COMPLETED);

    expect(result).toBeTruthy();
    expect(result).toMatch(statusState.COMPLETED);
  });

  it('should map queue delivered to status processing', () => {
    const result = queueToStatus(queueState.DELIVERED);

    expect(result).toBeTruthy();
    expect(result).toMatch(statusState.PROCESSING);
  });

  it('should map queue errored to status pending', () => {
    const result = queueToStatus(queueState.ERRORED);

    expect(result).toBeTruthy();
    expect(result).toMatch(statusState.PENDING);
  });

  it('should map queue enqueued to status pending', () => {
    const result = queueToStatus(queueState.ENQUEUED);

    expect(result).toBeTruthy();
    expect(result).toMatch(statusState.PENDING);
  });

  it('should map queue failed to status failed', () => {
    const result = queueToStatus(queueState.FAILED);

    expect(result).toBeTruthy();
    expect(result).toMatch(statusState.FAILED);
  });

  it('should map queue processing to status processing', () => {
    const result = queueToStatus(queueState.PROCESSING);

    expect(result).toBeTruthy();
    expect(result).toMatch(statusState.PROCESSING);
  });

  it('should map queue removed to status cancelled', () => {
    const result = queueToStatus(queueState.REMOVED);

    expect(result).toBeTruthy();
    expect(result).toMatch(statusState.CANCELLED);
  });
});
