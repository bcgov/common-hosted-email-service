import encoding from 'k6/encoding';
import http from 'k6/http';
import { check, fail } from 'k6';

// -------------------------------------------------------------------------------------------------
// 1. Init
// -------------------------------------------------------------------------------------------------

const client = '<CHES service client id here>';
const senderEmail = `${__ENV.sender ? __ENV.sender : 'donotreplyCHES@gov.bc.ca'}`;
// https://k6.io/docs/using-k6/environment-variables
const secret = `${__ENV.secret}`;
const env = `${__ENV.env ? __ENV.env : 'dev'}`;
const targetEmail = `${__ENV.target}`
let emailUrl = 'api/v1/email';
let oidcUrl = 'auth/realms/comsvcauth/protocol/openid-connect/token';

// Options for the test run. These can be overidden for a run. See https://k6.io/docs/using-k6/options
export let options = {
  clientSecret: undefined,
  // Token only lasts 5 mins
  maxDuration: '4m55s',
  thresholds: {
    // the rate of successful checks should be higher than 99%
    // TODO: figure out what this should be (100%)
    checks: ['rate>0.99'],
  },
  userAgent: 'CommonServicesTeamLoadTestK6/1.0',

  // K6 vars, overload in the command
  iterations: 1,
  vus: 1
  // For now comment out the 2 lines above and uncomment below for rate testing
  // TODO: parameterize this into 2 scenarios that can be invoked
  // scenarios: {
  //   contacts: {
  //     executor: 'constant-arrival-rate',
  //     rate: 2250, // this is per-minute, see "timeUnit" below
  //     duration: '4m',
  //     preAllocatedVUs: 50,
  //     timeUnit: '1m',
  //     maxVUs: 300,
  //   },
  // },
};

// URL strings
if (env === 'dev' || env === 'test') {
  emailUrl = `https://ches-${env}.api.gov.bc.ca/${emailUrl}`;
  oidcUrl = `https://${env}.loginproxy.gov.bc.ca/${oidcUrl}`
} else if (env === 'prod') {
  emailUrl = `https://ches.api.gov.bc.ca/${emailUrl}`;
  oidcUrl = `https://loginproxy.gov.bc.ca/${oidcUrl}`
} else if (env && env.match(/pr-\d+/g)) {
  emailUrl = `https://ches-dev-${env}-master.apps.silver.devops.gov.bc.ca/${emailUrl}`;
  oidcUrl = `https://dev.loginproxy.gov.bc.ca/${oidcUrl}`
} else {
  fail('No valid environment supplied. Supply "dev", "test", "prod", or "pr##".');
}

// -------------------------------------------------------------------------------------------------
// 2. Setup
// -------------------------------------------------------------------------------------------------
export function setup() {
  console.log(`Email url: ${emailUrl}`);
  console.log(`SSO url: ${oidcUrl}`);
  console.debug('Getting Token');
  // Check a secret was supplied or nothing will work
  var pattern = new RegExp('^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', 'i');
  if (!secret.match(pattern)) {
    fail('No valid service client secret supplied. Specify a "SECRET" environment variable with the secret for TEST_SERVICE_CLIENT.');
  }

  // Get a token first to use in the run (only lasts 5 minutes)
  const oidcPayload = {
    grant_type: 'client_credentials',
  };

  // Basic Auth
  const encodedCredentials = encoding.b64encode(`${client}:${secret}`);
  const oidcOptions = {
    headers: {
      Authorization: `Basic ${encodedCredentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };


  let oidcRes = http.post(oidcUrl, oidcPayload, oidcOptions);
  console.debug(`Response from SSO: ${JSON.stringify(oidcRes, 0, 2)}`);
  if (!check(oidcRes, {
    'token response is 200': (r) => r.status === 200,
    'token response has a token': (r) => r.json("access_token")
  })
  ) {
    fail('could not get an access token from SSO, did you supply a client secret?');
  }
  return { token: oidcRes.json("access_token") };
}


// -------------------------------------------------------------------------------------------------
// 3. VU Code
// -------------------------------------------------------------------------------------------------
export default function (data) {
  console.log(`VU: ${__VU}  -  ITER: ${__ITER}`);
  console.debug('Running Tests');
  console.debug(`Data from setup: ${JSON.stringify(data)}`);
  if (!data.token) {
    fail('ERROR: No token available from setup step.');
  }

  const options = {
    headers: {
      Authorization: `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  const payload = {
    bcc: [],
    body: `CHES url: ${emailUrl}`,
    bodyType: "html",
    cc: [],
    delayTS: 0,
    encoding: "utf-8",
    from: senderEmail,
    priority: "normal",
    subject: `Load Test VU: ${__VU}  -  ITER: ${__ITER}`,
    to: [
      targetEmail
    ]
  };

  const emailRes = http.post(emailUrl, JSON.stringify(payload), options);
  console.debug(JSON.stringify(emailRes, 0, 2));
  if (!check(emailRes, {
    'email response is 201': (r) => r.status === 201,
    'email response has expected body': (r) => r.json("messages")
  })) {
    console.warn(JSON.stringify(emailRes, 0, 2));
  }
}


// -------------------------------------------------------------------------------------------------
// 4. Teardown
// -------------------------------------------------------------------------------------------------
// N/A
