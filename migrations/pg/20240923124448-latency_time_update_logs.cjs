"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add a temporary column to hold the new JSONB data
      await queryInterface.addColumn(
        "raw_data",
        "latency_temp",
        {
          type: Sequelize.JSONB
        },
        { transaction }
      );

      // Update the temporary column with the transformed data
      await queryInterface.sequelize.query(
        `
        UPDATE "raw_data"
        SET "latency_temp" = jsonb_build_object(
          'over_all_time', CAST("latency" AS TEXT),
          'model_execution_time', '',
          'execution_time_logs', COALESCE(CAST(CAST("latency" AS TEXT) AS JSONB)->'execution_time_logs', '{}'::jsonb)
        )
        WHERE "latency" IS NOT NULL;
        `,
        { transaction }
      );

      // Remove the old 'latency' column
      await queryInterface.removeColumn("raw_data", "latency", { transaction });

      // Rename 'latency_temp' to 'latency'
      await queryInterface.renameColumn("raw_data", "latency_temp", "latency", {
        transaction
      });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Add a temporary column to hold the float data
      await queryInterface.addColumn(
        "raw_data",
        "latency_temp",
        {
          type: Sequelize.FLOAT
        },
        { transaction }
      );

      // Extract 'over_all_time' value back to float
      await queryInterface.sequelize.query(
        `
        UPDATE "raw_data"
        SET "latency_temp" = ("latency"->>'over_all_time')::FLOAT
        WHERE "latency" IS NOT NULL;
        `,
        { transaction }
      );

      // Remove the JSONB 'latency' column
      await queryInterface.removeColumn("raw_data", "latency", { transaction });

      // Rename 'latency_temp' back to 'latency'
      await queryInterface.renameColumn("raw_data", "latency_temp", "latency", {
        transaction
      });

      // Commit the transaction
      await transaction.commit();
    } catch (err) {
      // Rollback transaction if any errors occurred
      await transaction.rollback();
      throw err;
    }
  }
};
