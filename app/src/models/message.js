module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    msgId: {
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      type: DataTypes.UUID,
      validate: {
        isUUID: 4
      }
    },
    txId: {
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      type: DataTypes.UUID,
      validate: {
        isUUID: 4
      }
    },
    user: {
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      type: DataTypes.UUID,
      validate: {
        isUUID: 4
      }
    },
    tag: {
      allowNull: true,
      comment: 'A unique string which is associated with the message',
      type: DataTypes.STRING(64),
      validate: {
        is: /^\S*$/g
      }
    }
  }, {
    comment: 'Message metadata and associations',
    tableName: 'message'
  });
  Message.associate = () => {};
  return Message;
};
