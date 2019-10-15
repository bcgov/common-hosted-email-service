exports.up = function (knex) {
  
  const statusTable = (table) => {
    table.uuid('messageId').references('messageId').inTable('message').notNullable().index();
    table.string('status').notNullable().defaultTo('accepted');
    table.string('description').nullable();
    table.timestamp('createdAt', { useTz: true }).defaultTo(knex.fn.now());
  };
  
  return Promise.resolve()
    .then(() => knex.schema.createTable('trxn', table => {
      table.uuid('transactionId').primary();
      table.string('client').notNullable();
      table.timestamp('createdAt', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updatedAt', { useTz: true }).defaultTo(knex.fn.now());
    }))
    .then(() => knex.schema.createTable('message', table => {
      table.uuid('messageId').primary();
      table.uuid('transactionId').references('transactionId').inTable('trxn').notNullable().index();
      table.string('tag').nullable();
      table.bigInteger('delayTimestamp').nullable();
      table.string('status').notNullable().defaultTo('accepted');
      table.timestamp('createdAt', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updatedAt', { useTz: true }).defaultTo(knex.fn.now());
    }))
    .then(() => knex.schema.createTable('status', table => {
      table.increments('statusId').primary();
      statusTable(table);
    }))
    .then(() => knex.schema.createTable('content', table => {
      table.increments('contentId').primary();
      table.uuid('messageId').references('messageId').inTable('message').notNullable().index();
      table.json('email');
      table.timestamp('createdAt', { useTz: true }).defaultTo(knex.fn.now());
      table.timestamp('updatedAt', { useTz: true }).defaultTo(knex.fn.now());
    }))
    .then(() => knex.schema.createTable('queue', table => {
      table.increments('queueId').primary();
      table.uuid('externalQueueId').notNullable();
      statusTable(table);
    }));
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('queue')
    .dropTableIfExists('content')
    .dropTableIfExists('status')
    .dropTableIfExists('message')
    .dropTableIfExists('trxn');
};
