"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // eslint-disable-next-line no-unused-vars
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION insert_into_fifteen_minute_data(job_id int, config jsonb)
    RETURNS void LANGUAGE plpgsql AS
    $$
    BEGIN
      INSERT INTO fifteen_minute_data 
          (org_id, apikey_id, service, model, 
           latency_sum,success_count,record_count, created_at, total_token_count,cost_sum, thread_id, version_id, bridge_id, time_zone)
      SELECT 
          org_id, apikey_id, service, model, 
          latency_sum,success_count,record_count, interval, total_token_count,cost_sum,thread_id, version_id, bridge_id, time_zone
      FROM fifteen_min_data_aggregate
      WHERE interval > (SELECT COALESCE(MAX(created_at), 'epoch'::timestamp) FROM fifteen_minute_data)
      ON CONFLICT (org_id, service,bridge_id,apikey_id,thread_id,version_id, model, created_at)
      DO UPDATE SET
          latency_sum = fifteen_minute_data.latency_sum + EXCLUDED.latency_sum,
          cost_sum = fifteen_minute_data.cost_sum + EXCLUDED.cost_sum,
          record_count = fifteen_minute_data.record_count + EXCLUDED.record_count,
          total_token_count = fifteen_minute_data.total_token_count + EXCLUDED.total_token_count,
          success_count = fifteen_minute_data.success_count + EXCLUDED.success_count;
    END;
    $$;
    
  `);

    await queryInterface.sequelize.query(`
  SELECT add_job('insert_into_fifteen_minute_data',  '15 minutes', initial_start => '2024-12-24 18:31:00+00'::timestamptz);
`);
  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    let jobId = 0;
    await queryInterface.sequelize
      .query(
        `
    SELECT job_id  as id
FROM timescaledb_information.jobs where proc_name like 'insert_into_fifteen_minute_data';
  `
      )
      .then((result) => {
        jobId = result[0][0].id;
      });
    await queryInterface.sequelize.query(`
      DROP FUNCTION insert_into_fifteen_minute_data;
    `);
    if (jobId) {
      await queryInterface.sequelize.query(`
        SELECT delete_job(${jobId});
      `);
    }
  }
};
