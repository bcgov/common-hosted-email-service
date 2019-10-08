const { Model } = require('objection');

class Trxn extends Model {
  static get tableName() {
    return 'trxn';
  }
  
  static relationMappings() {
    const Message = require('./message');
    return {
      messages: {
        relation: Model.HasManyRelation,
        modelClass: Message,
        join: {
          from: 'trxn.id',
          to: 'message.txId'
        }
      }
    };
  }

}

module.exports = Trxn;
