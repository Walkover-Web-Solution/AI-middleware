/* eslint-disable no-unused-vars */
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("conversation_logs", {
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
      updated_llm_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      prompt: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      user_feedback: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      tools_call_data: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      message_id: {
        type: Sequelize.STRING
      },
      sub_thread_id: {
        type: Sequelize.STRING
      },
      thread_id: {
        type: Sequelize.STRING
      },
      version_id: {
        type: Sequelize.STRING
      },
      bridge_id: {
        type: Sequelize.STRING
      },
      user_urls: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      llm_urls: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      AiConfig: {
        type: Sequelize.JSONB
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
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.BOOLEAN,
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
      child_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP")
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("conversation_logs");
  }
};
