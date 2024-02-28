"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE MATERIALIZED VIEW five_min_data_aggregate
      WITH (timescaledb.continuous) AS
      SELECT 
          org_id,
          authkey_name,
          service,
          model, 
          time_bucket('5 minutes', created_at) as interval,
          COUNT(*) FILTER (where status = 'success') AS success_count,
          SUM(latency) AS sum_latency,
          SUM(expected_cost) AS expected_cost_sum,
          SUM(input_tokens + output_tokens) AS token_count,
          COUNT(*) AS record_count
      FROM raw_data
      GROUP BY 
          org_id, interval, service,authkey_name, model;
    `);

    await queryInterface.sequelize.query(`
      SELECT add_continuous_aggregate_policy('five_min_data_aggregate',
          start_offset => INTERVAL '15 minutes',
          end_offset => INTERVAL '0',
          schedule_interval => INTERVAL '5 minutes');
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP MATERIALIZED VIEW IF EXISTS five_min_data_aggregate;
    `);
  },
};
