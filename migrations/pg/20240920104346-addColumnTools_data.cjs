"use strict";

const { Sequelize } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
const up = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.addColumn(
      "conversations",
      "tools_call_data",
      {
        type: Sequelize.ARRAY(Sequelize.JSON),
        allowNull: true,
      },
      { transaction }
    );
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const down = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.removeColumn("conversations", "tools_call_data", { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = { up, down };
