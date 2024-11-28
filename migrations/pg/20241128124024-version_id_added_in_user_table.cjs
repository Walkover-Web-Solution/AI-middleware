'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('user_bridge_config_history', 'version_id', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });
  },

  async down (queryInterface) {
    await queryInterface.removeColumn('user_bridge_config_history', 'version_id');
  }
};