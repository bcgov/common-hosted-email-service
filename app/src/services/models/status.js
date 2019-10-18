const { Model } = require('objection');

class Status extends Model {
  static get tableName () {
    return 'status';
  }

  static get idColumn () {
    return 'statusId';
  }

  static relationMappings () {
    const Message = require('./message');
    return {
      owner: {
        relation: Model.BelongsToOneRelation,
        modelClass: Message,
        join: {
          from: 'status.messageId',
          to: 'message.messageId'
        }
      }
    };
  }

}

module.exports = Status;
