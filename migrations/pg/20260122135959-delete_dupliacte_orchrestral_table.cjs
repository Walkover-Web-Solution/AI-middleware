"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the orchestrator_history table
    await queryInterface.dropTable("orchestrator_history");
  },

  async down(queryInterface, Sequelize) {
    // Recreate the orchestrator_history table if rollback is needed
    await queryInterface.createTable("orchestrator_history", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      org_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      thread_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      sub_thread_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      model_name: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      orchestrator_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      user: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      response: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      tool_call_data: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      latency: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      tokens: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      error: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      variables: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      user_urls: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      llm_urls: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      ai_config: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },
};
