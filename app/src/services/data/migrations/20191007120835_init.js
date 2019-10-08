const uuidv4 = require('uuid/v4');

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => knex.schema.createTable('trxn', table => {
      table.uuid('id').primary();
      table.string('client').notNullable();
      table.timestamps(true, true);
    }))
    .then(() => knex.schema.createTable('message', table => {
      table.uuid('id').primary();
      table.uuid('txId').references('id').inTable('trxn').notNullable().index();
      table.string('tag').nullable();
      table.bigInteger('delayTS').nullable();
      table.string('status').defaultTo('accepted');
      table.timestamps(true, true);
    }))
    .then(() => knex.schema.createTable('status', table => {
      table.increments('id').primary();
      table.uuid('msgId').references('id').inTable('message').notNullable().index();
      table.string('status').notNullable().defaultTo('accepted');
      table.timestamp('created_at', {useTz: true}).defaultTo(knex.fn.now());
    }))
    .then(() => knex.schema.createTable('content', table => {
      table.increments('id').primary();
      table.uuid('msgId').references('id').inTable('message').notNullable().index();
      table.json('content');
    }))
    .then(async () => {
      // we could use .returning from the insert, but not supported by sqlite.
      // so we will query for the parent and insert the children
      return await knex('trxn').insert({id: uuidv4(), client: 'mssc'});
    })
    .then(async () => {
      const row = await knex.table('trxn').first();
      return await knex('message').insert({id: uuidv4(), txId: row.id, tag: undefined, delayTS: undefined});
    })
    .then(async () => {
      const row = await knex.table('message').first();
      return await knex('status').insert({msgId: row.id});
    })
    .then(async () => {
      const row = await knex.table('message').first();
      return await knex('content').insert({msgId: row.id, content: {a: 'b', c:'d'}});
    });
  
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('content')
    .dropTableIfExists('status')
    .dropTableIfExists('message')
    .dropTableIfExists('trxn');
};
