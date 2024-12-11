'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('conversations', 'version_id', {
        type: Sequelize.STRING, // Adjust the type as needed
        allowNull: true, // Set to false if you want to enforce NOT NULL
    });
    
    await queryInterface.removeColumn('conversations','mode')
  },

  async down (queryInterface) {
    await queryInterface.removeColumn('conversations', 'version_id');

  }
};


