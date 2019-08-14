const config = require('config');
const log = require('npmlog');

const checks = require('../../../src/components/checks');

log.level = config.get('server.logLevel');

describe('getStatus', () => {
  it('should yield an array of statuses', async () => {
    const result = await checks.getStatus();
    expect(result).toBeTruthy();
    expect(result.length).toEqual(1);
  });
});
