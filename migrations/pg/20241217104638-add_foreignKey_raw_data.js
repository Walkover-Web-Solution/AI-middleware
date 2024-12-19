'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add primary key constraint to message_id
      await queryInterface.addConstraint('conversations', {
        fields: ['message_id'],
        type: 'foreign key',
        name: 'conversations_message_id_fkey',
        references: {
          table: 'raw_data',
          field: 'message_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        transaction
      });
      await queryInterface.addConstraint('raw_data', {
        fields: ['message_id'],
        type: 'primary key',
        name: 'raw_data_message_id_pk',
        transaction
      });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeConstraint('raw_data', 'raw_data_message_id_pk', { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
