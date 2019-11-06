/**
 * @module StatsTracker
 *
 * Log statistics for CHES Requests.
 *
 * @see morgan
 *
 * @exports StatsTracker
 */
const log = require('npmlog');
const moment = require('moment');
const morgan = require('morgan');

const stackpole = require('../components/stackpole');

const mailUrl = '/api/v1/email';
const mergeUrl = '/api/v1/emailMerge';
const statsUrls = [mailUrl, mergeUrl];

const mailApiTrackerFormat = ':azp :op :txId :msgId :ts :response-time';

const mailApiTracker = async (req, res, next) => {

  if (statsUrls.includes(req.url)) {
    const defaultEnd = res.end;
    const chunks = [];
    req._timestamp = moment.utc().valueOf();
    req._operation = req.url === mailUrl ? 'MAIL' : 'MERGE';
    res._transactionId = '-';
    res._messageIds = '';
    res._to = '';

    res.end = (...restArgs) => {
      try {
        if (restArgs[0]) {
          chunks.push(Buffer.from(restArgs[0]));
        }
        const body = Buffer.concat(chunks).toString('utf8');
        const obj = JSON.parse(body);
        res._transactionId = obj.txId;
        res._messageIds = obj.messages.map(m => m.msgId).join(',');
      } catch (err) {
        log.error('mailApiTracker', err);
      }
      defaultEnd.apply(res, restArgs);
    };
  }
  next();
};

const initializeMailApiTracker = (app) => {

  // register token parser functions.
  // this one would depend on authorizedParty middleware being loaded
  morgan.token('azp', (req) => {
    return req.authorizedParty ? req.authorizedParty : '-';
  });

  morgan.token('op', (req) => {
    return req._operation ? req._operation : '-';
  });

  morgan.token('ts', (req) => {
    return req._timestamp ? req._timestamp : '-';
  });

  morgan.token('txId', (req, res) => {
    return res._transactionId ? res._transactionId : '-';
  });

  morgan.token('msgId', (req, res) => {
    return res._messageIds ? res._messageIds : '-';
  });

  app.use(morgan(mailApiTrackerFormat, {
    // eslint-disable-next-line no-unused-vars
    skip: function (req, res) {
      return !statsUrls.includes(req.baseUrl);
    },
    stream: {
      write: (s) => {
        stackpole.mailStats(s);
      }
    }
  }));

  app.use(mailApiTracker);

};

module.exports = initializeMailApiTracker;
