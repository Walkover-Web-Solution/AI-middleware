'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('raw_data', {
      id: {
        allowNull: false,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      org_id: {
        type: Sequelize.STRING
      },
      authkey_name: {
        type: Sequelize.STRING,
      },
      latency: {
        type: Sequelize.FLOAT
      },
      service: {
        type: Sequelize.STRING
      },
      model: {
        type: Sequelize.STRING
      },
      status :{
        type:   Sequelize.BOOLEAN,
      },
      error:{
        type:Sequelize.STRING,
        default:"none"
      },
      input_tokens: {
        type: Sequelize.FLOAT
      },
      output_tokens: {
        type: Sequelize.FLOAT
      },
      expected_cost: {
        type: Sequelize.FLOAT
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('raw_data');
  }
};
