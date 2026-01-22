"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.renameColumn("orchestrator_conversation_logs", "image_urls", "user_urls");

    await queryInterface.renameColumn("orchestrator_conversation_logs", "urls", "llm_urls");
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.renameColumn("orchestrator_conversation_logs", "user_urls", "image_urls");

    await queryInterface.renameColumn("orchestrator_conversation_logs", "llm_urls", "urls");
  },
};
