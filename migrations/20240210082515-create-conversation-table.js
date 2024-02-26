'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('conversations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      org_id: {
        type: Sequelize.STRING
      },
      bridge_id: {
        type: Sequelize.STRING
      },
      model_name: {
        type: Sequelize.STRING
      },
      thread_id: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.TEXT
      },
      message_by: {
        type: Sequelize.STRING
      },
      type:{
        type:Sequelize.ENUM('chat', 'completion', 'embedding'),
        allowNull: false,
        defaultValue: 'chat'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      function:{
        allowNull: true,
        type: Sequelize.JSON
      }
      
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('conversations');
  }
};
