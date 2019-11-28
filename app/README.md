# Common Hosted Email Service

CHES - Powered by NodeMailer (a shared library)

## Application

The application is a node server which serves the Common Hosted Email Service API. It uses the following dependencies from NPM:

Authentication & Password Management

* `keycloak-connect` - Keycloak Node.js adapter ([npm](https://www.npmjs.com/package/keycloak-connect))

Networking

* `api-problem` - RFC 7807 problem details ([npm](https://www.npmjs.com/package/api-problem))
* `express` - Server middleware ([npm](https://www.npmjs.com/package/express))
* `nodemailer` - SMTP mail library ([npm](https://www.npmjs.com/package/nodemailer))

Logging

* `morgan` - HTTP request logger ([npm](https://www.npmjs.com/package/morgan))
* `npmlog` - General log framework ([npm](https://www.npmjs.com/package/npmlog))

Templating

* `nunjucks` - Jinja2 style templating language ([npm](https://www.npmjs.com/package/nunjucks))

Queueing and Persisting

* `bull` - Redis-based queue for Node ([npm](https://www.npmjs.com/package/bull))
* `knex` - Multi-dialect query builder ([npm](https://www.npmjs.com/package/knex))



### General Code Layout

The codebase is separated into a few discrete layers:

* `components` - Business logic layer - the majority of useful functionality resides here
* `docs` - Contains OpenAPI 3.0 Yaml specification and ReDoc renderer
* `routes` - Express middleware routing

## Quickstart Guide

In order for the application to run correctly, you will need to ensure that the following have been addressed:

1. All node dependencies have been installed and resolved
2. You have a Redis-compatible memory store available to connect to.
3. Environment configurations have been set up

### Install

#### Node Application

As this is a Node application, please ensure that you have all dependencies installed as needed. This can be done by running `npm install`.

#### Redis

In order to run this microservice locally, you must have a Redis 3.2 compatible memory store available to connect to. This can be achieved in many ways depending on your platform, such as through Docker, or installing directly onto your machine. Visit <https://redis.io/download> to get a copy of the binaries if you are on a Unix machine or to acquire the Docker image to run locally.

For Windows users who wish to install Redis directly onto your machine, there is currently no recent Windows binary officially available from Redis Labs. In lieu of that, we can leverage Memurai instead, which is a Redis 5.0 compatible distribution for Windows platforms. You can acquire the binaries for that at <https://www.memurai.com/get-memurai>.

In order to view and manipulate Redis, you can either acquire a Redis compatible CLI, or get a GUI tool. We suggest installing the GUI tool `redis-commander` for managing Redis.

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

1. Look at [custom-environment-variables.json](/backend/config/custom-environment-variables.json) and ensure you have the environment variables locally set.
2. Create a `local.json` file in the config folder. This file should never be added to source control.
3. Consider creating a `local-test.json` file in the config folder if you want to use different configurations while running unit tests. This file will be necessary because `local.json` takes precedence over `test.json`.

For more details, please consult the config library [documentation](https://github.com/lorenwest/node-config/wiki/Configuration-Files).

#### Environment Variables

| Environment Variable | Description |
| --- | --- |
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

This API is defined and described in OpenAPI 3.0 specification. When the API is running, you should be able to view the specification through ReDoc at <http://localhost:3000/api/v1/docs> (assuming you are running this microservice locally). Otherwise, the general API can usually be found under the `/api/v1/docs` path.

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
