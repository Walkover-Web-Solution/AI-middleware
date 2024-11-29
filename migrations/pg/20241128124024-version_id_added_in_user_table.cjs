'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add the 'version_id' column to 'user_bridge_config_history'
    await queryInterface.addColumn('user_bridge_config_history', 'version_id', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '',
    });

    // Add validation for 'bridge_id' as well
    await queryInterface.changeColumn('user_bridge_config_history', 'bridge_id', {
      type: Sequelize.STRING,
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

    // Optionally, remove validation from 'bridge_id' if needed
    await queryInterface.changeColumn('user_bridge_config_history', 'bridge_id', {
      type: queryInterface.sequelize.Sequelize.STRING,
      validate: {}
    });
  }
};