const atob = require('atob');
const Problem = require('api-problem');

/** Authorized Party Middleware
 *  CHES requires that we separate all requests by the caller/client.
 *  We will use the azp (Authorized Party) from the JWT and stored that as
 *  the transaction client.
 *  This middleware must be called after our keycloak protect.
 *
 *  This middleware will add a property to the request: authorizedParty.
 *
 * @see module:knex
 * @see module:keycloak
 */

const authorizedParty = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace('-', '+').replace('_', '/');
    const jwt = atob.atob(base64);
    const jsonWebToken = JSON.parse(jwt);
    req.authorizedParty = jsonWebToken.azp;
    if (!req.authorizedParty) throw Error('No AZP');
  } catch (err) {
    return new Problem(400, {
      detail: 'Could not determine Authorized Party'
    }).send(res);
  }
  next();
};

module.exports = authorizedParty;
