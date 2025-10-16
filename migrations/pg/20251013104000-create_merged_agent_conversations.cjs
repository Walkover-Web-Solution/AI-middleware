'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Step 0: Drop existing agent_conversations table if it exists
    try {
      await queryInterface.dropTable('agent_conversations');
    } catch (error) {
      // Table doesn't exist, continue
    }

    // Step 1: Create new agent_conversations table with merged schema
    await queryInterface.createTable('agent_conversations', {
      // Identity
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      org_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      thread_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      bridge_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sub_thread_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      
      // Messages
      user_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      chatbot_response: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      
      // Tools & Functions
      tools_call_data: {
        type: Sequelize.JSON, // Array of JSON
        allowNull: true
      },
      
      // Metadata
      user_feedback: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      version_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      revised_response: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      image_urls: {
        type: Sequelize.JSON, // Array of JSON
        allowNull: true
      },
      urls: {
        type: Sequelize.JSON, // Array of STRING
        allowNull: true
      },
      fallback_model: {
        type: Sequelize.STRING,
        allowNull: true
      },
      
      // Status & Error
      error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.INTEGER, // 0: failed, 1: success, 2: retry success
        allowNull: true
      },
      finish_reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      
      // Timestamps
      createdAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      
      // Service Info
      authkey_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      latency: {
        type: Sequelize.JSON,
        allowNull: true
      },
      service: {
        type: Sequelize.STRING,
        allowNull: true
      },
      model_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type: {
        type: Sequelize.STRING, // chat, completion, embedding
        allowNull: true
      },
      
      // Tokens (JSON object)
      tokens: {
        type: Sequelize.JSON, // {input_tokens, output_tokens, expected_cost}
        allowNull: true
      },
      
      // Additional
      message_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      variables: {
        type: Sequelize.JSON,
        allowNull: true
      },
      AiConfig: {
        type: Sequelize.JSON,
        allowNull: true
      },
      annotations: {
        type: Sequelize.JSON, // Array of JSON
        allowNull: true
      }
    });

    // Step 2: Migrate data from conversations table
    await queryInterface.sequelize.query(`
      INSERT INTO agent_conversations (
        org_id, thread_id, bridge_id, sub_thread_id, user_message, response, 
        chatbot_response, user_feedback, version_id, revised_response, 
        image_urls, urls, fallback_model, model_name, type, message_id, 
        "AiConfig", annotations, tools_call_data
      )
      SELECT 
        org_id,
        thread_id,
        bridge_id,
        sub_thread_id,
        CASE WHEN message_by = 'user' THEN message ELSE NULL END as user_message,
        CASE WHEN message_by = 'assistant' THEN message ELSE NULL END as response,
        chatbot_message as chatbot_response,
        user_feedback,
        version_id,
        updated_message as revised_response,
        array_to_json(image_urls) as image_urls,
        array_to_json(urls) as urls,
        fallback_model,
        model_name,
        type,
        message_id,
        "AiConfig",
        array_to_json(annotations) as annotations,
        array_to_json(tools_call_data) as tools_call_data
      FROM conversations
    `);

    // Step 3: Update agent_conversations with data from raw_data table
    await queryInterface.sequelize.query(`
      UPDATE agent_conversations 
      SET 
        authkey_name = rd.authkey_name,
        latency = rd.latency,
        service = rd.service,
        tokens = jsonb_build_object(
          'input_tokens', rd.input_tokens,
          'output_tokens', rd.output_tokens,
          'expected_cost', rd.expected_cost
        ),
        variables = rd.variables,
        created_at = rd.created_at,
        error = COALESCE(agent_conversations.error, rd.error),
        status = COALESCE(agent_conversations.status, CASE WHEN rd.status = true THEN 1 ELSE 0 END),
        model_name = COALESCE(agent_conversations.model_name, rd.model)
      FROM raw_data rd 
      WHERE agent_conversations.message_id = rd.message_id
    `);
  },

  async down (queryInterface, Sequelize) {
    // Simply drop the agent_conversations table since we didn't modify original tables
    await queryInterface.dropTable('agent_conversations');
  }
};
