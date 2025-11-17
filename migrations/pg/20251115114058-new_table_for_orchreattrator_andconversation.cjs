'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('conversation_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      llm_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      user: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      chatbot_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      updated_chatbot_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      user_feedback: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      tools_call_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      message_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sub_thread_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      thread_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      version_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      bridge_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      image_urls: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      urls: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      AiConfig: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      fallback_model: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      org_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      service: {
        type: Sequelize.STRING,
        allowNull: true
      },
      model: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      tokens: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      variables: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      latency: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      firstAttemptError: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      finish_reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      parent_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for commonly queried fields
    await queryInterface.addIndex('conversation_logs', ['message_id']);
    await queryInterface.addIndex('conversation_logs', ['thread_id']);
    await queryInterface.addIndex('conversation_logs', ['sub_thread_id']);
    await queryInterface.addIndex('conversation_logs', ['org_id']);
    await queryInterface.addIndex('conversation_logs', ['parent_id']);
    await queryInterface.addIndex('conversation_logs', ['created_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('conversation_logs');
  }
};
