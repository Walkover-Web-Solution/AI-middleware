"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("raw_data", "firstAttemptError", {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("raw_data", "firstAttemptError");
  }
};
