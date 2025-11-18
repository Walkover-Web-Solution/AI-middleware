'use strict';

import { Model } from "sequelize";

export default ((sequelize, DataTypes) => {
  class orchestrator_conversation_logs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here if needed
    }
  }
  
  orchestrator_conversation_logs.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    llm_message: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    user: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    chatbot_message: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    updated_llm_message: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    prompt: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    error: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    tools_call_data: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    message_id: {
      type: DataTypes.JSONB
    },
    sub_thread_id: {
      type: DataTypes.STRING
    },
    thread_id: {
      type: DataTypes.STRING
    },
    version_id: {
      type: DataTypes.JSONB
    },
    bridge_id: {
      type: DataTypes.JSONB
    },
    image_urls: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    urls: {
      type: DataTypes.JSONB,
      defaultValue: []
    },
    AiConfig: {
      type: DataTypes.JSONB
    },
    fallback_model: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    org_id: {
      type: DataTypes.STRING
    },
    service: {
      type: DataTypes.STRING
    },
    model: {
      type: DataTypes.JSONB
    },
    status: {
      type: DataTypes.JSONB,
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
      type: DataTypes.JSONB,
      allowNull: true
    },
    finish_reason: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    agents_path: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      defaultValue: []
    }
  }, {
    sequelize,
    modelName: 'orchestrator_conversation_logs',
    tableName: 'orchestrator_conversation_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return orchestrator_conversation_logs;
});


