"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("conversations", "image_url", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("conversations", "revised_prompt", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("conversations", "image_url");
    await queryInterface.removeColumn("conversations", "revised_prompt");
  },
};
