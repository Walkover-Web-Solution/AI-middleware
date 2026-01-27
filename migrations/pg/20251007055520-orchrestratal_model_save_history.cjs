/* eslint-disable no-unused-vars */
"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orchestrator_history", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      org_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      thread_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sub_thread_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      model_name: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: '{"bridge_id": "model_name"}'
      },
      orchestrator_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      user: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: '{"bridge_id": [messages]}'
      },
      response: {
        type: Sequelize.JSON,
        allowNull: false,
        comment: '{"bridge_id": [messages]}'
      },
      tool_call_data: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '{"bridge_id": tool_call_json}'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW")
      },
      latency: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '{"bridge_id": latency_json}'
      },
      tokens: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '{"bridge_id": tokens_json}'
      },
      error: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '{"bridge_id": error_json}'
      },
      variables: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '{"bridge_id": variables_json}'
      },
      user_urls: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '{"bridge_id": user_urls}'
      },
      llm_urls: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '{"bridge_id": llm_urls}'
      },
      ai_config: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: '{"bridge_id": ai_config_json}'
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("orchestrator_history");
  }
};
