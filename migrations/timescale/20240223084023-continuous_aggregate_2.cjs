"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // eslint-disable-next-line no-unused-vars
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE MATERIALIZED VIEW daily_data_aggregate
      WITH (timescaledb.continuous) AS
      SELECT 
          org_id,
          apikey_id,
          service,
          model, 
          version_id,
          thread_id,
          bridge_id,
          time_bucket('1 day', created_at) as interval,
          SUM(success_count) AS success_count,
          SUM(latency_sum) AS latency_sum,
          SUM(cost_sum) AS cost_sum,
          SUM(record_count) AS record_count,
          SUM(total_token_count) AS total_token_count
        FROM fifteen_minute_data where time_zone =  'Asia/Kolkata'
        GROUP BY 
          org_id, bridge_id, version_id, interval, service, apikey_id, model, thread_id;
          `); // input token sum?

    await queryInterface.sequelize.query(`
      SELECT add_continuous_aggregate_policy('daily_data_aggregate',
          start_offset => INTERVAL '3 days',
          end_offset => INTERVAL '0',
          schedule_interval => INTERVAL '1 day',
          initial_start => '2024-12-24 18:30:00+00'::timestamptz
          );
    `);
    await queryInterface.sequelize.query(`
      SELECT set_chunk_time_interval('daily_data_aggregate', INTERVAL '1 day');
    `);
  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP MATERIALIZED VIEW IF EXISTS daily_data_aggregate;
    `);
  },
};
