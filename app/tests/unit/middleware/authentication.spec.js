const config = require('config');
const jwt = require('jsonwebtoken');

const mw = require('../../../src/middleware/authentication');

jest.mock('config');

beforeEach(() => {
  jest.resetAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('_spkiWrapper', () => {

  it('returns the PEM format we expect', () => {
    // eslint-disable-next-line max-len
    const spki = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA4CcG7WPTCF4YLHxT3bs9ilcQ6SS+A2e/PiZ9hqR0noelBCsdW0SQGOhjE7nhl2lrZ0W/o80YKMzNZ42Hmc7p0sHU3RN95OCTHvyCazC/CKM2i+gD+cAspP/Ns+hOqNmxC/XIsgD3bZ2zobNMhNy3jgDaAsbs3kOGPIwkdo/vWeo7N6fZPxOgSp6JoGBDtehuyhQ/4y2f7TnyicIvHMuc2d7Bz4GalQ/ra+GspmZ/HqL93A6c8sDHa8fqC8O+gnzpBNsCOxJcq/i3NOaGrOFMCiJwsNVc2dUcY8epcW3pwakIRLlC6D7oawbxv7c3UsXoCt4XSC0hdjwXg5kxVXHoDQIDAQAB';

    const result = mw._spkiWrapper(spki);

    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result).toEqual(`-----BEGIN PUBLIC KEY-----\n${spki}\n-----END PUBLIC KEY-----`);
  });
});

describe('tokenValidator', () => {
  const jwtVerifySpy = jest.spyOn(jwt, 'verify');
  let req, res, next;

  beforeEach(() => {
    req = { get: jest.fn() };
    res = {};
    next = jest.fn();
  });

  describe('Keycloak client Authorization', () => {
    const authorization = 'bearer ';
    const serverUrl = 'serverUrl';
    const realm = 'realm';
    const spki = 'SOMESPKI';
    const publicKey = `-----BEGIN PUBLIC KEY-----\n${spki}\n-----END PUBLIC KEY-----`;

    it.each([
      ['SPKI', spki],
      ['PEM', publicKey]
    ])('sets authType to BEARER with keycloak.publicKey %s and valid auth token', async (_desc, pkey) => {
      jwtVerifySpy.mockReturnValue({ sub: 'sub' }); // return truthy value
      config.has
        .mockReturnValueOnce(true) // keycloak.publicKey
        .mockReturnValueOnce(true) // keycloak.puserverUrlblicKey
        .mockReturnValueOnce(true); // keycloak.realm
      config.get
        .mockReturnValueOnce(pkey) // keycloak.publicKey
        .mockReturnValueOnce(serverUrl) // keycloak.serverUrl
        .mockReturnValueOnce(realm); // keycloak.realm
      req.get.mockReturnValueOnce(authorization);

      await mw.tokenValidator(req, res, next);

      expect(req.get).toHaveBeenCalledTimes(1);
      expect(req.get).toHaveBeenCalledWith('Authorization');
      expect(jwtVerifySpy).toHaveBeenCalledTimes(1);
      expect(jwtVerifySpy).toHaveBeenCalledWith(expect.any(String), publicKey, expect.objectContaining({
        issuer: `${serverUrl}/realms/${realm}`
      }));
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('short circuits with invalid auth token', async () => {
      const authorization = 'bearer ';
      config.has
        .mockReturnValueOnce(true) // keycloak.publicKey
        .mockReturnValueOnce(true) // keycloak.puserverUrlblicKey
        .mockReturnValueOnce(true); // keycloak.realm
      config.get
        .mockReturnValueOnce(spki) // keycloak.publicKey
        .mockReturnValueOnce(serverUrl) // keycloak.serverUrl
        .mockReturnValueOnce(realm); // keycloak.realm
      req.get.mockReturnValueOnce(authorization);

      await mw.tokenValidator(req, res, next);

      expect(req.get).toHaveBeenCalledTimes(1);
      expect(req.get).toHaveBeenCalledWith('Authorization');
      expect(jwtVerifySpy).toHaveBeenCalledTimes(1);
      expect(jwtVerifySpy).toHaveBeenCalledWith(expect.any(String), publicKey, expect.objectContaining({
        issuer: `${serverUrl}/realms/${realm}`
      }));
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('short circuits without keycloak.publicKey', async () => {
      jwtVerifySpy.mockReturnValue({ sub: 'sub' });

      config.has.mockReturnValueOnce(false); // keycloak.publicKey
      req.get.mockReturnValueOnce(authorization);

      await mw.tokenValidator(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(expect.any(Object));
    });
  });
});
