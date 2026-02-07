"use strict";

const { Sequelize } = require("sequelize");

/** @type {import('sequelize-cli').Migration} */
const up = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.addColumn(
      "conversations",
      "user_feedback",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        validate: {
          isIn: [[0, 1, 2]]
        }
      },
      { transaction }
    );

    await queryInterface.addColumn(
      "conversations",
      "message_id",
      {
        type: Sequelize.UUID,
        allowNull: true,
        defaultValue: null
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
    await queryInterface.removeColumn("conversations", "user_feedback", { transaction });
    await queryInterface.removeColumn("conversations", "message_id", { transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = { up, down };
