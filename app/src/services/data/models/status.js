const { Model } = require('objection');

class Status extends Model {
  static get tableName() {
    return 'status';
  }
  
  static relationMappings() {
    const Message = require('./message');
    return {
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Message,
        join: {
          from: 'status.msgId',
          to: 'message.id'
        }
      }
    };
  }
  
}

module.exports = Status;
