"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // eslint-disable-next-line no-unused-vars
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      CREATE MATERIALIZED VIEW fifteen_min_data_aggregate
      WITH (timescaledb.continuous) AS
      SELECT 
          org_id,
          apikey_id,
          service,
          model, 
          version_id,
          thread_id,
          bridge_id,
          time_zone,
          time_bucket('15 minutes', created_at) as interval,
          COUNT(*) FILTER (where success = true) AS success_count,
          SUM(latency) AS latency_sum,
          SUM(cost) AS cost_sum,
          SUM(total_tokens) AS total_token_count, 
          COUNT(*) AS record_count
      FROM metrics_raw_data
      GROUP BY 
          org_id, bridge_id, version_id, interval, service, apikey_id, model, thread_id, time_zone;
    `); // input token sum?

    await queryInterface.sequelize.query(`
      SELECT add_continuous_aggregate_policy('fifteen_min_data_aggregate',
          start_offset => INTERVAL '1 hour',
          end_offset => INTERVAL '0',
          schedule_interval => INTERVAL '15 minutes',
          initial_start => '2024-12-24 00:30:00+00'
    );
    `);
    await queryInterface.sequelize.query(`
      SELECT set_chunk_time_interval('fifteen_min_data_aggregate', INTERVAL '1 day');
      `);
  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP MATERIALIZED VIEW IF EXISTS fifteen_min_data_aggregate;
    `);
  }
};
