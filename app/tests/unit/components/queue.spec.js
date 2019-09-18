const config = require('config');
const log = require('npmlog');

const queue = require('../../../src/components/queue');

log.level = config.get('server.logLevel');



describe('enqueue', () => {
  let spy;

  beforeEach(() => {
    spy = jest.spyOn(queue.queue, 'add');
  });

  afterEach(() => {
    spy.mockRestore();
  });

  it('should add a message to the queue', () => {
    const message = {};
    spy.mockImplementation(() => {});

    const result = queue.enqueue(message);
    expect(result).toBeTruthy();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
