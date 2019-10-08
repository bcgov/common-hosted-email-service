const { Model } = require('objection');

class Message extends Model {
  static get tableName() {
    return 'message';
  }
  
  static relationMappings() {
    const Content = require('./content');
    const Status = require('./status');
    const Trxn = require('./trxn');
    return {
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Trxn,
        join: {
          from: 'message.txId',
          to: 'trxn.id'
        }
      },
      statuses: {
        relation: Model.HasManyRelation,
        modelClass: Status,
        join: {
          from: 'message.id',
          to: 'status.msgId'
        }
      },
      content: {
        relation: Model.HasOneRelation,
        modelClass: Content,
        join: {
          from: 'message.id',
          to: 'content.msgId'
        }
      }
    };
  }
}

module.exports = Message;
