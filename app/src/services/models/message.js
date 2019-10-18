const { Model } = require('objection');
const { UpdatedAt } = require('./mixins');

class Message extends UpdatedAt(Model) {
  static get tableName () {
    return 'message';
  }

  static get idColumn () {
    return 'messageId';
  }

  static relationMappings () {
    const Queue = require('./queue');
    const Status = require('./status');
    const Trxn = require('./trxn');
    return {
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Trxn,
        join: {
          from: 'message.transactionId',
          to: 'trxn.transactionId'
        }
      },
      statusHistory: {
        relation: Model.HasManyRelation,
        modelClass: Status,
        join: {
          from: 'message.messageId',
          to: 'status.messageId'
        }
      },
      queueHistory: {
        relation: Model.HasManyRelation,
        modelClass: Queue,
        join: {
          from: 'message.messageId',
          to: 'queue.messageId'
        }
      }

    };
  }
}

module.exports = Message;
