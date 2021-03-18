# Load Tests

## Setup

These tests use k6 to run. <https://k6.io/docs/>

To run the tests from your local command line install
k6 in the manner of your choosing
<https://k6.io/docs/getting-started/installation>

## Running

These tests will use the TEST_SERVICE_CLIENT client for the DEV realm.

For now these are bactches of requests in a single run. We're looking at scenarios to build (x requests ramped over a period of time). So a token fetch happens once (and only once) in the setup step. So if a test were to run longer than the token time out it would start to fail, but we shouldn't be doing that right now with this makeup anyways. If we write some longer time period scenarios we can figure out a timed token refresh situation.

### Environment variables

Custom environment variables are supplied to k6 with the `-e` arg.

**secret** - the TEST_SERVICE_CLIENT secret (for now always using this client, could parameterize as well)

**target** - the email to send emails TO

**sender** - Default: "donotreplyCHES@extest.gov.bc.ca" the email to send emails FROM

**env** - Default: "dev" - the ches and sso environment to use. To specify a PR, use "pr-##" as the value. Don't use "prod" unless you're really sure.

### k6 options

(See <https://k6.io/docs/using-k6/options>, can also be supplied as enfironment vars if you want)

**vus** - supply as `--vus`. This is the number of concurrent virtual users

**iterations** - supply as `--iterations`. This is the fixed number of total iterations the test will run

### Example commands

`k6 run -e secret=SC_SECRET_HERE -e target=keo62354@cuoly.com --vus=10 --iterations=100 script.js`

`k6 run -e secret=SC_SECRET_HERE -e target=keo62354@cuoly.com -e sender=chesTest@extest.gov.bc.ca -e env=test --vus=100 --iterations=3000 script.js`
