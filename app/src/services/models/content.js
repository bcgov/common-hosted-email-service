const { Model } = require('objection');
const { UpdatedAt } = require('./mixins');

class Content extends UpdatedAt(Model) {
  static get tableName () {
    return 'content';
  }
  
  static get idColumn () {
    return 'contentId';
  }
  
  static get jsonAttributes () {
    return ['email'];
  }
  
  static relationMappings () {
    const Message = require('./message');
    return {
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Message,
        join: {
          from: 'content.messageId',
          to: 'message.messageId'
        }
      }
    };
  }
  
}

module.exports = Content;
