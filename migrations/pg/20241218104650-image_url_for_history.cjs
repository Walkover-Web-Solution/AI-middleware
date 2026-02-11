"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("conversations", "urls", {
      type: Sequelize.ARRAY(Sequelize.TEXT), // Change to ARRAY of TEXT
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("conversations", "urls");
  }
};
