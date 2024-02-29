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
          
          SUM(sum_latency) AS sum_latency,
          SUM(expected_cost_sum) AS expected_cost_sum,
          SUM(token_count) AS token_count,
          SUM(success_count) AS success_count,
          
          SUM(record_count) AS record_count,
          time_bucket('1 day', created_at, 'Asia/Kolkata') as interval
      FROM five_minute_data
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
