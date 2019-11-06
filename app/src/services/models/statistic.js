const { Model } = require('objection');

class Statistic extends Model {
  static get tableName () {
    return 'statistic';
  }

  static get idColumn () {
    return 'statisticId';
  }

}

module.exports = Statistic;
