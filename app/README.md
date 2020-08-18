# Common Hosted Email Service

## Table of Contents

1. [Application Dependencies](#application-dependencies)
2. [General Code Layout](#general-code-layout)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [API Usage](#api-usage)
6. [General Design](#general-design)
7. [Templating](#templating)

## Application Dependencies

The CHES API uses the following dependencies from NPM:

Authentication & Password Management

* `keycloak-connect` - Keycloak Node.js adapter ([npm](https://www.npmjs.com/package/keycloak-connect))
* `openpgp` - OpenPGP library ([npm](https://www.npmjs.com/package/openpgp), LGPL-3.0)
  * Advisory: The current version of OpenPGP implemented has three known security vulnerabilities, mostly related to key and signature verification. ([NPM-1159](https://www.npmjs.com/advisories/1159), [NPM-1160](https://www.npmjs.com/advisories/1160), [NPM-1161](https://www.npmjs.com/advisories/1161)).
  * Note: We will be addressing these vulnerabilities in a future release of CHES. However, we believe the risk of leveraging PGP features currently is relatively low because CHES only leverages the generation of PGP encrypted and signed payloads, and not the verification of PGP content.

Networking

* `api-problem` - RFC 7807 problem details ([npm](https://www.npmjs.com/package/api-problem))
* `express` - Server middleware ([npm](https://www.npmjs.com/package/express))
* `nodemailer` - SMTP mail library ([npm](https://www.npmjs.com/package/nodemailer))
* `validator` - String validation library ([npm](https://www.npmjs.com/package/validator))

Logging

* `morgan` - HTTP request logger ([npm](https://www.npmjs.com/package/morgan))
* `npmlog` - General log framework ([npm](https://www.npmjs.com/package/npmlog))

Templating

* `nunjucks` - Jinja2 style templating language ([npm](https://www.npmjs.com/package/nunjucks))

Queueing and Persistence

* `bull` - Redis-based queue for Node ([npm](https://www.npmjs.com/package/bull))
* `knex` - Multi-dialect query builder ([npm](https://www.npmjs.com/package/knex))
* `objection` - ORM manager ([npm](https://www.npmjs.com/package/objection))
* `pg` - PostgreSQL Driver ([npm](https://www.npmjs.com/package/pg))

### General Code Layout

The codebase is separated into a few discrete layers:

* `components` - Business logic layer - the majority of useful functionality resides here
* `docs` - Contains OpenAPI 3.0 Yaml specification and ReDoc renderer
* `middleware` - Contains express middleware for layering functionality
* `routes` - Express middleware routing

## Quickstart Guide

In order for the application to run correctly, you will need to ensure that the following have been addressed:

1. All node dependencies have been installed and resolved
2. You have a Redis-compatible memory store available to connect to.
3. Environment configurations have been set up
4. You have a 'ches' Postgres database to connect to

### Installation

#### Node Application

As this is a Node application, please ensure that you have all dependencies installed as needed. This can be done by running `npm install`.

#### Redis

In order to run this microservice locally, you must have a Redis 3.2 or higher memory store available to connect to. This can be achieved in many ways depending on your platform, such as through Docker, or installing directly onto your machine. Visit <https://redis.io/download> to get a copy of the binaries if you are on a Unix machine or to acquire the Docker image to run locally.

For Windows users who wish to install Redis directly onto your machine, there is currently no recent Windows binary officially available from Redis Labs. In lieu of that, we can leverage Memurai instead, which is a Redis 5.0 compatible distribution for Windows platforms. You can acquire the binaries for that at <https://www.memurai.com/get-memurai>.

In order to view and manipulate Redis, you can either acquire a Redis compatible CLI, or get a GUI tool. We suggest installing the GUI tool ([redis-commander](https://www.npmjs.com/package/redis-commander)) for managing Redis.

One-off execution:

``` sh
npx redis-commander -p 8888
```

Global installation:

``` sh
npm i redis-commander -g
redis-commander -p 8888
```

Visit <http://localhost:8888> for access. Take note of how you access your Redis as you will need that information for later configuration steps.

### Configuration

Configuration management is done using the [config](https://www.npmjs.com/package/config) library. There are two ways to configure:

1. Look at [custom-environment-variables.json](config/custom-environment-variables.json) and ensure you have the environment variables locally set.
2. Create a `local.json` file in the config folder. This file should never be added to source control.
3. Consider creating a `local-test.json` file in the config folder if you want to use different configurations while running unit tests. This file will be necessary because `local.json` takes precedence over `test.json`.

For more details, please consult the config library [documentation](https://github.com/lorenwest/node-config/wiki/Configuration-Files).

#### Environment Variables

| Environment Variable | Description |
| --- | --- |
| `DB_DATABASE` | Postgres database name |
| `DB_HOST` | Postgres database hostname |
| `DB_USERNAME` | Postgres database username |
| `DB_PASSWORD` | Postgres database password |
| `KC_CLIENTID` | Keycloak Client username |
| `KC_CLIENTSECRET` | Keycloak Client password |
| `KC_REALM` | Associated Keycloak realm |
| `KC_SERVERURL` | Base authentication url for Keycloak |
| `REDIS_HOST` | URL to access Redis |
| `REDIS_PASSWORD` | The Redis password |
| `SERVER_ATTACHMENTLIMIT` | Maximum attachment size the API will accept |
| `SERVER_BODYLIMIT` | Maximum body length the API will accept |
| `SERVER_LOGLEVEL` | Server log verbosity. Options: `silly`, `verbose`, `debug`, `info`, `warn`, `error` |
| `SERVER_MORGANFORMAT` | Morgan format style. Options: `dev`, `combined` |
| `SERVER_PORT` | Port server is listening to |
| `SERVER_SMTPHOST` | The SMTP server this app will leerage |

#### Database Connection

The CHES API requires a postgres database
First create an empty database  named 'ches' (your db connection parameters go in your local.json config file)
Then can create the db schema by running fron the /app directory:

``` sh
npm run migrate
```

## Commands

After addressing the prerequisites, the following are common commands that are used for this application.

### Run the server with hot-reloads for development

``` sh
npm run serve
```

### Run the server

``` sh
npm run start
```

### Run your tests

``` sh
npm run test
```

### Lints files

``` sh
npm run lint
```

## API Usage

This API is defined and described in OpenAPI 3.0 specification.
When the API is running, you should be able to view the specification through ReDoc at <http://localhost:3000/api/v1/docs> (assuming you are running this microservice locally). A hosted instance of the API can be found at: <https://ches-master-9f0fbe-prod.pathfinder.gov.bc.ca/api/v1/docs>

### General Design

The standard `/email` endpoint is relatively straightforward due to effectively being a passthrough to NodeMailer. However, the merging endpoints `/email/merge` and `/email/merge/preview` are a bit more involved.

#### Concepts

In order to provide unique templating results to multiple email destinations, we have the concept of a Context. A **Context** is a freeform JSON object which consists of key-value pairs. Its sole purpose is to provide a key-value mapping repository between an inline templated variable on a template string and what is the intended output after the values are replaced.

The email merge API has a One to Many relationship between a template string and a context. While there can be many contexts that exist, the API expects to only have one template string. This relationship is modeled this way because typically users will want to have a standard template for batch emails, but will want to replace certain parts of text with their own variable content based on whom it is getting issued to.

In order for a template to be successfully populated, it requires a context object which *should* contain the variables which will be replaced. For the most part, Nunjucks is intended to behave as a glorified string-replacement engine. In the event the Context object has extra variables that are not used by a Template, nothing happens. You can expect to see blank spots where the templated value should be at.

**IMPORTANT**: All keys in the Context object (variable names in the template) *MUST* contain only alphanumeric or underscore.

``` json
{
  "this_is_fine": {
    "thisIsGood": "good key/variable",
    "thisIs_Good_2": "fine key/variable"
  },
  "this is $%&*$!": "bad key/variable"
}
```

### Templating

We currently leverage the Nunjucks library for templated variable replacement. Its syntax is similar to the well-used [Jinja2](https://jinja.palletsprojects.com) library from Python. We will outline the most common use cases and examples for the templating engine below. For full details on templating, refer to the Nunjucks documentation at <https://mozilla.github.io/nunjucks/templating.html>.

#### [Variable Substitution](https://mozilla.github.io/nunjucks/templating.html#variables)

In general, the Nunjucks templating engine allows variables to be in-line displayed through the use of double curly braces. Suppose you wanted a variable `foo` to be displayed. You can do so by adding the following into a template:

``` sh
{{ foo }}
```

Nunjucks also supports complex nested objects in the Context as well. You can lookup properties that have dots in them just like you would in Javascript. Suppose for example you have the following context object and template string:

Context

``` json
{
  "something": {
    "greeting": "Hello",
    "target": "World"
  },
  "someone": "user"
}
```

Template String

``` sh
"{{ something.greeting }} {{ someone }} content {{ target }}"
```

You can expect the template engine to yield the following:

``` sh
"Hello user content World"
```

Finally, if a value resolves to either `undefined` or `null`, nothing is rendered. Suppose you have the following context object and template string:

Context

``` json
{
  "void": "abyss"
}
```

Template String

``` sh
"{{ verb }} into the {{ void }} and the {{ void }} will {{ verb }} back at you."
```

You can expect the template engine to yield the following:

``` sh
" into the abyss and the abyss will  back at you."
```

#### [Filtering](https://mozilla.github.io/nunjucks/templating.html#filters)

You also have the ability to do simple transformations onto variables before they are rendered. These filters may be invoked by the use of a pipe operator (`|`). These filters may be able to take parameters, and can be chained. For a more comprehensive list of potential filters, check <https://mozilla.github.io/nunjucks/templating.html#builtin-filters>.

Suppose you have the following context object and template string:

Context

``` json
{
  "foo": "bar"
}
```

Template String

``` sh
"{{ foo | upper }} everything"
```

You can expect the template engine to yield the following:

``` sh
"BAR everything"
```

### OpenPGP Encryption

The CHES API also provides optional OpenPGP encryption and signing support as of version 1.1.0. In order to fully utilize this feature, you will need to have a working understanding of how the [Pretty Good Privacy](https://en.wikipedia.org/wiki/Pretty_Good_Privacy) system works. You will also need to have at minimum an OpenPGP public and private key pair at your disposal.

When this optional feature is used, you can expect resulting emails, including any attachments, to be fully wrapped and encrypted in an attachment called `encrypted.asc`. While OpenPGP key generation and management itself can be a complex topic, we will provide an extremely quick and dirty guide to get started in the following sections. We also provide a test public and private key pair embedded as an example in the CHES OpenAPI specification. You may use this example directly as it will be properly [pre-formatted](#key-formatting) for use in the example request body.

#### Generating OpenPGP keys

The following instructions will require you to have access to the free GNU `gpg` command-line tool. This is normally preinstalled on most Unix distributions, and can be installed on Windows via [gpg4win](https://www.gpg4win.org/). For more information on the `gpg` command line tool, visit their documentation [here](https://gnupg.org/documentation/manpage.html), or refer to a gpg cheat sheet [here](http://irtfweb.ifa.hawaii.edu/~lockhart/gpg/).

To generate a new PGP public/private key pair, run the following:

``` sh
gpg --gen-key
```

This will interactively ask you at minimum a "Real name" and "Email address" to attach to the key identity, as well as a password to optionally encrypt the private key.

Once the key pair is generated, you can export the public and private keys with the following commands. You will need to change "Test User" to whatever you specified in the "Real name" step.

``` sh
gpg --export -a "Test User" > public.key
gpg --export-secret-key -a "Test User" > private.key
```

If done correctly, you should have a `public.key` and `private.key` file which contains the PGP Key Blocks for your newly generated key. This will be needed to leverage OpenPGP in ches.

#### Using OpenPGP keys in CHES

While the entire OpenPGP feature is optional, there are multiple levels of optionality in this feature. In order to only encrypt an email, you will need to at minimum define the `encryptionKeys` array field. `encryptionKeys` accepts an array of 1 or more PGP Public Key Blocks encoded as a single-line string literal. If more than one key is specified, the email will be encrypted multiple times so that it can be decrypted by the owner of their respective public keys.

In addition to encryption, CHES also supports signing an email with an OpenPGP private key. In order to leverage the signing feature, BOTH `encryptionKeys` and `signingKey` fields must be defined at minimum. Messages will not be encrypted nor signed unless encryptionKeys attribute is present. If the private key being used is protected by a password, you will also need to have the `signingKeyPassphrase` field defined. The CHES API will only accept one signing key per discrete email if it is specified.

##### Key Formatting

After inspecting your PGP Key Blocks, you will notice that they are formatted into multiple lines. In order to pass this into the request body for the CHES API correctly, you will need to ensure that the PGP Key Block is collapsed into a single line. In addition, all newlines must be preserved and encoded as `\n` in the string.

In order to convert your PGP Key Blocks to the correct CHES format, you can use the following replacement strategy in command line.

``` sh
cat public.key | sed '$!s/$/\\n/' | tr -d '\n'
cat private.key | sed '$!s/$/\\n/' | tr -d '\n'
```

The output of the above commands can then be copied into your request body as specified in the OpenAPI specification. If the fields are valid PGP Key Blocks and properly formatted, you can expect your emails to be PGP encrypted (and signed if specified).
