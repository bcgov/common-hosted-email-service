const config = require('config');

/** Knex configuration
 *  Set database configuration for application and knex configuration for migrations
 *  and seeding.  Since configuration values can change via env. vars or property
 *  files, we only need on 'environment' for knex.
 *
 *  Note: it appears that the knexfile must be in the root for the config values
 *  to be read correctly when running the 'npm run migrate:*' scripts.
 * @module knexfile
 * @see module:knex
 * @see module:config
 */
module.exports = {
  client: 'pg',
  connection: {
    host: config.get('db.host'),
    user: config.get('db.username'),
    password: config.get('db.password'),
    database: config.get('db.database')
  },
  migrations: {
    directory: __dirname + '/src/services/data/migrations'
  },
  pool: {
    min: 0,
    max: 7
  },
  seeds: {
    directory: __dirname + '/src/services/data/seeds'
  }
};
