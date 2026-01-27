"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("conversations", "sub_thread_id", {
      type: Sequelize.STRING, // Adjust the type as needed
      allowNull: true // Set to false if you want to enforce NOT NULL
    });

    // Copy data from thread_id to sub_thread_id
    await queryInterface.sequelize.query(`
        UPDATE conversations
        SET sub_thread_id = thread_id
    `);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("conversations", "sub_thread_id");
  }
};
