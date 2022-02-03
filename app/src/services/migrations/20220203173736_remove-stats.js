exports.up = function (knex) {
  return knex.schema.dropTableIfExists("statistic");
};

exports.down = function (knex) {
  return Promise.resolve().then(() =>
    knex.schema.createTable("statistic", (table) => {
      table.increments("statisticId").primary();
      table.string("operation");
      table.string("client");
      table.uuid("transactionId");
      table.uuid("messageId");
      table.string("status");
      table.timestamp("timestamp", { useTz: true });
      table.timestamp("delay", { useTz: true }).nullable();
    })
  );
};
