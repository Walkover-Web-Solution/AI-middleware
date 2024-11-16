'use strict';

import { Sequelize } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export const up = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.addColumn(
      'conversations', // Table name
      'mode', // New column name
      {
        type: Sequelize.INTEGER, // Column type
        allowNull: true, // Allow null values, adjust as needed
        defaultValue: 0, // Default value
      },
      { transaction }
    );
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

export const down = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.removeColumn('conversations', 'mode', { transaction });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};