const { Model } = require('objection');
const { UpdatedAt } = require('./mixins');

class Trxn extends UpdatedAt(Model) {
  static get tableName () {
    return 'trxn';
  }
  
  static get idColumn () {
    return 'transactionId';
  }
  
  static relationMappings () {
    const Message = require('./message');
    return {
      messages: {
        relation: Model.HasManyRelation,
        modelClass: Message,
        join: {
          from: 'trxn.transactionId',
          to: 'message.transactionId'
        }
      }
    };
  }
  
}

module.exports = Trxn;
