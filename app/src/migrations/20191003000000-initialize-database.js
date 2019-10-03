module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.createTable('message', {
          msgId: {
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
            type: Sequelize.UUID
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
          },
          deletedAt: {
            allowNull: true,
            type: Sequelize.DATE
          },
          txId: {
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
            type: Sequelize.UUID
          },
          user: {
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
            type: Sequelize.UUID
          },
          tag: {
            allowNull: true,
            comment: 'A unique string which is associated with the message',
            type: Sequelize.STRING(64)
          }
        }, {
          comment: 'Message metadata and associations',
          transaction: t
        })
      ]);
    });
  },

  down: queryInterface => {
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        queryInterface.dropTable('message', {
          transaction: t
        })
      ]);
    });
  }
};
