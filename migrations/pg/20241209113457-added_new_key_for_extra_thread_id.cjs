"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("conversations", "external_reference", {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("conversations", "external_reference");
  }
};
