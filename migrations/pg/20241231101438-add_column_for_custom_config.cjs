"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("conversations", "AiConfig", {
      type: Sequelize.JSON, // Change to JSON
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("conversations", "AiConfig");
  },
};
