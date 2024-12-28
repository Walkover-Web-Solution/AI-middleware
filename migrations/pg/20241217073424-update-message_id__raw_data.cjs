'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add the message_id column to raw_data
      await queryInterface.addColumn('raw_data', 'message_id', {
        type: Sequelize.STRING,
        allowNull: true,
      }, { transaction });

      // Update the message_id in raw_data from conversations
      await queryInterface.sequelize.query(`
        UPDATE raw_data
        SET message_id = conversations.message_id
        FROM conversations
        WHERE raw_data.chat_id = conversations.id;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Remove the message_id column from raw_data
      await queryInterface.removeColumn('raw_data', 'message_id', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
