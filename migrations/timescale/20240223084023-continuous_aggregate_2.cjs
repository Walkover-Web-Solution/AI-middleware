"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE MATERIALIZED VIEW daily_data_aggregate
      WITH (timescaledb.continuous) AS
      SELECT 
          org_id,
          authkey_name,
          service,
          model,
          time_bucket('1 day', created_at, 'Asia/Kolkata') as interval,

          SUM(latency) AS sum_latency,
          SUM(expected_cost) AS expected_cost_sum,
          SUM(input_tokens + output_tokens) AS token_count,
          COUNT(CASE WHEN status = 'success' THEN 1 END) AS success_count,

          COUNT(*) AS record_count
      FROM raw_data
      GROUP BY 
          org_id, interval, authkey_name,service, model;
    `);

    await queryInterface.sequelize.query(`
      SELECT add_continuous_aggregate_policy('daily_data_aggregate',
          start_offset => INTERVAL '3 days',
          end_offset => INTERVAL '0',
          schedule_interval => INTERVAL '1 day',
          initial_start => '2024-02-20 18:30:00+00'::timestamptz
          );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP MATERIALIZED VIEW IF EXISTS daily_data_aggregate;
    `);
  },
};
