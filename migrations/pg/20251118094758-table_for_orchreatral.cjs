'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('orchestrator_conversation_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      llm_message: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      user: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      chatbot_message: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      updated_llm_message: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      prompt: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      error: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      tools_call_data: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      message_id: {
        type: Sequelize.JSONB
      },
      sub_thread_id: {
        type: Sequelize.STRING
      },
      thread_id: {
        type: Sequelize.STRING
      },
      version_id: {
        type: Sequelize.JSONB
      },
      bridge_id: {
        type: Sequelize.JSONB
      },
      image_urls: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      urls: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      AiConfig: {
        type: Sequelize.JSONB,
      },
      fallback_model: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      org_id: {
        type: Sequelize.STRING
      },
      service: {
        type: Sequelize.STRING
      },
      model: {
        type: Sequelize.JSONB
      },
      status: {
        type: Sequelize.JSONB,
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
        type: Sequelize.JSONB,
        allowNull: true
      },
      finish_reason: {
        type: Sequelize.JSONB,
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
      },
      agents_path: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('orchestrator_conversation_logs');
  }
};
