'use strict';

import { Model } from "sequelize";
export default ((sequelize, DataTypes) => {
  class agent_conversations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // raw_data table has been merged into agent_conversations, so no association needed
    }
  }
  agent_conversations.init({
    org_id: DataTypes.STRING,
    thread_id: DataTypes.STRING,
    model_name: DataTypes.STRING,
    bridge_id: DataTypes.STRING,
    // New merged columns from migration
    user_message: DataTypes.TEXT,
    response: DataTypes.TEXT,
    chatbot_response: DataTypes.TEXT,
    revised_response: DataTypes.TEXT,
    error: DataTypes.TEXT,
    status: DataTypes.BOOLEAN,
    authkey_name: DataTypes.STRING,
    latency: DataTypes.FLOAT,
    service: DataTypes.STRING,
    tokens: DataTypes.JSON,
    created_at: DataTypes.DATE,
    variables: DataTypes.JSON,
    finish_reason: DataTypes.STRING,
    firstAttemptError: DataTypes.TEXT,
    // Existing columns
    function: DataTypes.JSON,
    tools_call_data: DataTypes.JSON,
    image_urls: DataTypes.JSON,
    urls: DataTypes.JSON,
    AiConfig: DataTypes.JSON,
    annotations: DataTypes.JSON,
    fallback_model: DataTypes.STRING,
    type: {
      type: DataTypes.ENUM('chat', 'completion', 'embedding'),
      allowNull: true // Changed to allow null since it's now merged
    },
    message_id : DataTypes.UUIDV4,
    user_feedback: DataTypes.INTEGER,
    version_id: DataTypes.STRING,
    sub_thread_id: DataTypes.STRING,
    external_reference: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'agent_conversations',
    tableName: 'agent_conversations'
  });
  return agent_conversations;
});
