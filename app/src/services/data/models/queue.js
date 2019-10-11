const { Model } = require('objection');

class Queue extends Model {
  static get tableName () {
    return 'queue';
  }
  
  static get idColumn () {
    return 'queueId';
  }
  
  static relationMappings () {
    const Message = require('./message');
    return {
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Message,
        join: {
          from: 'queue.messageId',
          to: 'message.messageId'
        }
      }
    };
  }
  
}

module.exports = Queue;
