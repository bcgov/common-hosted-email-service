exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('queue', table => {
      table.dropForeign('messageId');
      table.foreign('messageId').references('messageId').inTable('message').onUpdate('CASCADE').onDelete('CASCADE');
    }))
    .then(() => knex.schema.alterTable('status', table => {
      table.dropForeign('messageId');
      table.foreign('messageId').references('messageId').inTable('message').onUpdate('CASCADE').onDelete('CASCADE');
    }))
    .then(() => knex.schema.alterTable('message', table => {
      table.dropForeign('transactionId');
      table.foreign('transactionId').references('transactionId').inTable('trxn').onUpdate('CASCADE').onDelete('CASCADE');
    }));
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('message', table => {
      table.dropForeign('transactionId');
      table.foreign('transactionId').references('transactionId').inTable('trxn');
    }))
    .then(() => knex.schema.alterTable('status', table => {
      table.dropForeign('messageId');
      table.foreign('messageId').references('messageId').inTable('message');
    }))
    .then(() => knex.schema.alterTable('queue', table => {
      table.dropForeign('messageId');
      table.foreign('messageId').references('messageId').inTable('message');
    }));
};
