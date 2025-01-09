'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // eslint-disable-next-line no-unused-vars
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION insert_into_daily_data(job_id int, config jsonb)
    RETURNS void LANGUAGE plpgsql AS
    $$
    BEGIN
      INSERT INTO daily_data 
          (org_id, apikey_id , service, model, 
            latency_sum, success_count,record_count, created_at, total_token_count,cost_sum, thread_id, version_id, bridge_id)
      SELECT 
          org_id, apikey_id, service, model, 
          latency_sum, success_count,record_count, interval, total_token_count,cost_sum, thread_id, version_id, bridge_id
      FROM daily_data_aggregate
      WHERE interval > (SELECT COALESCE(MAX(created_at), 'epoch'::timestamp) FROM daily_data)
      ON CONFLICT (org_id, service,bridge_id,apikey_id,thread_id,version_id, model, created_at)
      DO UPDATE SET
      cost_sum = daily_data.cost_sum + EXCLUDED.cost_sum,
      latency_sum = daily_data.latency_sum + EXCLUDED.latency_sum,
      record_count = daily_data.record_count + EXCLUDED.record_count,
      success_count = daily_data.success_count + EXCLUDED.success_count,
      total_token_count = daily_data.total_token_count + EXCLUDED.total_token_count;
      END;
      $$;
      
      `);

    await queryInterface.sequelize.query(`
      SELECT add_job('insert_into_daily_data', '1 day', initial_start => '2024-12-24 18:31:00+00'::timestamptz);
    `)

  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    let jobId = 0;
    await queryInterface.sequelize.query(`
    SELECT job_id  as id
FROM timescaledb_information.jobs where proc_name like 'insert_into_daily_data';
  `).then((result) => {
    jobId = result[0][0].id;
  });
    await queryInterface.sequelize.query(`
      DROP FUNCTION insert_into_daily_data;
    `);
    if (jobId) {
      await queryInterface.sequelize.query(`
        SELECT delete_job(${jobId});
      `);
    }
  }
};