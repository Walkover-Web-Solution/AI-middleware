'use strict';

import { Model } from "sequelize";
export default ((sequelize, DataTypes) => {
  class conversation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      conversation.hasMany(models.raw_data, {
        foreignKey: 'chat_id',
        as: 'raw_data'
      });
    }
  }
  conversation.init({
    org_id: DataTypes.STRING,
    thread_id: DataTypes.STRING,
    model_name: DataTypes.STRING,
    bridge_id: DataTypes.STRING,
    message: DataTypes.TEXT,
    message_by: DataTypes.STRING,
    function: DataTypes.JSON,
    // created_at: DataTypes.DATE,
    type: {
      type: DataTypes.ENUM('chat', 'completion', 'embedding'),
      // Using ENUM for type field
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'conversations',
    tableName: 'conversations'
  });
  return conversation;
});