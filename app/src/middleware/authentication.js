const jwt = require('jsonwebtoken');
const Problem = require('api-problem');

const log = require('../components/log')(module.filename);
const config = require('config');

/**
 * @function _spkiWrapper
 * Wraps an SPKI key with PEM header and footer
 * @param {string} spki The PEM-encoded Simple public-key infrastructure string
 * @returns {string} The PEM-encoded SPKI with PEM header and footer
 */
const _spkiWrapper = (spki) => `-----BEGIN PUBLIC KEY-----\n${spki}\n-----END PUBLIC KEY-----`;

/**
 * @function tokenValidator
 *
 * This middleware validates the token in the Authorization header of the request
 * We have to be careful that this function does not throw an unhandled exception
 * because of our 'shutdown' behaviour enforced at a global level in /app.js
 * Consequently, we wrap this logic in a try/catch and return errors as the http response
 *
 * @param {object} req Express Request Object
 * @param {object} res Express Response Object
 * @param {function} next Express Callback Function
 */
async function tokenValidator(req, res, next) {
  try {
    const authorization = req.get('Authorization');
    const bearerToken = authorization.substring(7);

    if (config.has('keycloak.publicKey') &&
      config.has('keycloak.serverUrl') &&
      config.has('keycloak.realm')) {

      const publicKey = config.get('keycloak.publicKey');
      const pemKey = publicKey.startsWith('-----BEGIN')
        ? publicKey
        : _spkiWrapper(publicKey);

      jwt.verify(bearerToken, pemKey, {
        issuer: `${config.get('keycloak.serverUrl')}/realms/${config.get('keycloak.realm')}`
      });
    }
    else {
      return new Problem(400, {
        detail: 'OIDC environment variable KC_PUBLICKEY, KC_SERVERURL and KC_REALM must be defined'
      }).send(res);
    }
  } catch (err) {
    log.error(err.message, { function: 'tokenValidator' });
    return next(new Problem(403, { detail: 'Access token is missing or invalid', instance: req.originalUrl }));
  }
  next();
}

module.exports = { tokenValidator, _spkiWrapper };
