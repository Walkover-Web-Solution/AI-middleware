'use strict';

import { Model } from "sequelize";

export default ((sequelize, DataTypes) => {
  class conversation_logs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here if needed
    }
  }
  
  conversation_logs.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    llm_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    user: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    chatbot_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    updated_chatbot_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    user_feedback: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    tools_call_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    message_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    sub_thread_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    thread_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    version_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bridge_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    image_urls: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    urls: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    AiConfig: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    fallback_model: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    org_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    service: {
      type: DataTypes.STRING,
      allowNull: true
    },
    model: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    tokens: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    variables: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    latency: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    firstAttemptError: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    finish_reason: {
      type: DataTypes.STRING,
      allowNull: true
    },
    parent_id: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'conversation_logs',
    tableName: 'conversation_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return conversation_logs;
});
