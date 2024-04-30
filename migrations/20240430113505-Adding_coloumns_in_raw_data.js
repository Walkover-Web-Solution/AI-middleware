'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
 
    await queryInterface.addColumn('raw_data', 'chat_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'conversations',
        key: 'id',
      }
    });

    await queryInterface.addColumn('raw_data', 'variables', {
      type: Sequelize.JSON,
    });

    await queryInterface.addColumn('raw_data', 'is_present', {
      type: Sequelize.BOOLEAN,
    });
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn('raw_data', 'is_present');
    await queryInterface.removeColumn('raw_data', 'variables');
    await queryInterface.removeColumn('raw_data', 'chat_id');

  }
};

