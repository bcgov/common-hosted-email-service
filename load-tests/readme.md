# Load Tests

**Work in progress**

## Setup
These tests use k6 to run. https://k6.io/docs/

To run the tests from your local command line install
k6 in the manner of your choosing
https://k6.io/docs/getting-started/installation

## Running

These tests will use the TEST_SERVICE_CLIENT client for the DEV realm.

### Environment variables
Custom environment variables are supplied to k6 with the `-e` arg.

**secret** - the TEST_SERVICE_CLIENT secret

**target** - the email to send emails TO


### k6 options
(See https://k6.io/docs/using-k6/options, can also be supplied as enfironment vars if you want)

**vus** - supply as `--vus`. This is the number of concurrent virtual users

**iterations** - supply as `--iterations`. This is the fixed number of total iterations the test will run

### Example command:

`k6 run -e secret=SC_SECRET_HERE -e target=keo62354@cuoly.com --vus=10 --iterations=100 script.js`
