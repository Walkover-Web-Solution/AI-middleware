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
      // raw_data table has been merged into conversations, so no association needed
    }
  }
  conversation.init({
    org_id: DataTypes.STRING,
    thread_id: DataTypes.STRING,
    model_name: DataTypes.STRING,
    bridge_id: DataTypes.STRING,
    user_message: DataTypes.TEXT,
    response: DataTypes.TEXT,
    chatbot_response: DataTypes.TEXT,
    response_id: DataTypes.UUID,
    revised_response: DataTypes.TEXT,
    error: DataTypes.TEXT,
    status: DataTypes.BOOLEAN,
    authkey_name: DataTypes.STRING,
    latency: DataTypes.FLOAT,
    service: DataTypes.STRING,
    input_tokens: DataTypes.FLOAT,
    output_tokens: DataTypes.FLOAT,
    expected_cost: DataTypes.FLOAT,
    created_at: DataTypes.DATE,
    variables: DataTypes.JSON,
    finish_reason: DataTypes.STRING,
    firstAttemptError: DataTypes.TEXT,
    function: DataTypes.JSON,
    tools_call_data: DataTypes.JSON,
    image_urls: DataTypes.JSON,
    urls: DataTypes.JSON,
    AiConfig: DataTypes.JSON,
    annotations: DataTypes.JSON,
    fallback_model: DataTypes.STRING,
    type: {
      type: DataTypes.ENUM('chat', 'completion', 'embedding'),
      allowNull: true
    },
    message_id : DataTypes.UUIDV4,
    user_feedback: DataTypes.INTEGER,
    version_id: DataTypes.STRING,
    sub_thread_id: DataTypes.STRING,
    external_reference: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'conversations',
    tableName: 'conversations'
  });
  return conversation;
});