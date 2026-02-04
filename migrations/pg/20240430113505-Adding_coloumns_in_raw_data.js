"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn("raw_data", "chat_id", {
        type: Sequelize.INTEGER,
        references: {
          model: "conversations",
          key: "id",
        },
        transaction,
      });

      await queryInterface.addColumn("raw_data", "variables", {
        type: Sequelize.JSON,
        transaction,
      });

      await queryInterface.addColumn("raw_data", "is_present", {
        type: Sequelize.BOOLEAN,
        transaction,
      });

      await queryInterface.addConstraint("raw_data", {
        fields: ["chat_id"],
        type: "foreign key",
        references: {
          table: "conversations",
          field: "id",
        },
        name: "raw_data_chat_id_fk",
        where: {
          message_by: "user",
        },
        transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.removeConstraint("raw_data", "raw_data_chat_id_fk", { transaction });
      await queryInterface.removeColumn("raw_data", "is_present", { transaction });
      await queryInterface.removeColumn("raw_data", "variables", { transaction });
      await queryInterface.removeColumn("raw_data", "chat_id", { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
