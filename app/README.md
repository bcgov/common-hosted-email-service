# NodeMailer Proof of Concept

Testing out nodemailer in a NodeJS API

## Application

The application is a node server which serves the NodeMailer PoC API. It uses the following dependencies from NPM:

Authentication & Password Management

* `jsonwebtoken` - JWT parsing library
* `passportjs` - JWT and OIDC strategies

Networking

* `express` - Server middleware

Logging

* `morgan` - HTTP request logger
* `npmlog` - General log framework

### General Code Layout

The codebase is separated into a few discrete layers:

* `components` - Business logic layer - the majority of useful functionality resides here
* `docs` - Contains OpenAPI 3.0 Yaml specification and ReDoc renderer
* `routes` - Express middleware routing

## Quickstart Guide

In order for the application to run correctly, you will need to ensure that the following have been addressed:

1. All node dependencies have been installed and resolved
2. Environment configurations have been set up

### Install

As this is a Node application, please ensure that you have all dependencies installed as needed. This can be done by running `npm install`.

### Configuration

Configuration management is done using the [config](https://www.npmjs.com/package/config) library. There are two ways to configure:

1. Look at [custom-environment-variables.json](/backend/config/custom-environment-variables.json) and ensure you have the environment variables locally set.
2. Create a `local.json` file in the config folder. This file should never be added to source control.
3. Consider creating a `local-test.json` file in the config folder if you want to use different configurations while running unit tests.

For more details, please consult the config library [documentation](https://github.com/lorenwest/node-config/wiki/Configuration-Files).

#### Environment Variables

| Environment Variable | Description |
| --- | --- |
| `SERVER_LOGLEVEL` | Server log verbosity. Options: `silly`, `verbose`, `debug`, `info`, `warn`, `error` |
| `SERVER_MORGANFORMAT` | Morgan format style. Options: `dev`, `combined` |
| `SERVER_PORT` | Port server is listening to |

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
