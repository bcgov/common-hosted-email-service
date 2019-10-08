const { Model } = require('objection');

class Content extends Model {
  static get tableName() {
    return 'content';
  }
  
  static relationMappings() {
    const Message = require('./message');
    return {
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Message,
        join: {
          from: 'content.msgId',
          to: 'message.id'
        }
      }
    };
  }
  
}

module.exports = Content;
