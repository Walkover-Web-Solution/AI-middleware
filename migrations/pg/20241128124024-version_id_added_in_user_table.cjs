'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add the 'version_id' column to 'user_bridge_config_history'
    await queryInterface.addColumn('user_bridge_config_history', 'version_id', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });

    // Copy data from 'bridge_id' to 'version_id' for existing rows
    await queryInterface.sequelize.query(`
      UPDATE user_bridge_config_history
      SET version_id = bridge_id
    `);
  },

  async down (queryInterface) {
    // Remove the 'version_id' column in case of rollback
    await queryInterface.removeColumn('user_bridge_config_history', 'version_id');
  }
};