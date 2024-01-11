const jwt = require('jsonwebtoken');
const Problem = require('api-problem');

const log = require('../components/log')(module.filename);

/**
 * @function authorizedParty
 * @description Authorized Party Middleware
 * CHES requires that we separate all requests by the caller/client.
 * We will use the azp (Authorized Party) from the JWT and store that as
 * the transaction client.
 *
 * This middleware will add a property to the request: authorizedParty.
 * @param {object} req Express Request Object
 * @param {object} _res Express Response Object (unused)
 * @param {function} next Express Callback Function
 */
async function authorizedParty(req, _res, next) {
  try {
    const authorization = req.get('authorization');
    if (authorization) {
      const token = jwt.decode((req.get('authorization')).slice(7));
      req.authorizedParty = token?.azp ?? undefined;
    } else {
      req.authorizedParty = undefined;
    }
  } catch (err) {
    log.warn(err.message, { function: 'authorizedParty' });
    req.authorizedParty = undefined;
  }
  next();
}

/**
 * @function authorizedPartyValidator
 * @description Authorized Party Validator Middleware
 * This middleware must be called after our keycloak protect and after
 * authorizedParty middleware.
 *
 * This middleware will check if the authorized party token is on the request.
 * @param {object} req Express Request Object
 * @param {object} res Express Response Object
 * @param {function} next Express Callback Function
 */
async function authorizedPartyValidator(req, res, next) {
  try {
    if (!req.authorizedParty)
      throw new Error('Missing authorizedParty');
  } catch (err) {
    log.error(err.message, { function: 'authorizedPartyValidator' });
    return new Problem(400, {
      detail: 'Could not determine Authorized Party'
    }).send(res);
  }
  next();
}

module.exports = { authorizedParty, authorizedPartyValidator };
