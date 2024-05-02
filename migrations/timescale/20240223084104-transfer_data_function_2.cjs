'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION insert_into_daily_data(job_id int, config jsonb)
    RETURNS void LANGUAGE plpgsql AS
    $$
    BEGIN
      INSERT INTO daily_data 
          (org_id, authkey_name , service, model, 
            avg_latency, success_count,record_count, created_at, token_count,expected_cost_sum)
      SELECT 
          org_id, authkey_name, service, model, 
          avg_latency, success_count,record_count, interval, token_count,expected_cost_sum
      FROM daily_data_aggregate
      WHERE interval > (SELECT COALESCE(MAX(created_at), 'epoch'::timestamp) FROM daily_data)
      ON CONFLICT (org_id, service, model, created_at)
      DO UPDATE SET
          avg_latency = (daily_data.avg_latency * daily_data.record_count + EXCLUDED.avg_latency * EXCLUDED.record_count) / (daily_data.record_count + EXCLUDED.record_count),
          expected_cost_sum = daily_data.expected_cost_sum + EXCLUDED.expected_cost_sum,
          record_count = daily_data.record_count + EXCLUDED.record_count,
          success_count = daily_data.success_count + EXCLUDED.success_count,
          token_count = daily_data.token_count + EXCLUDED.token_count;
    END;
    $$;
    
  `);
    
  await queryInterface.sequelize.query(`
  SELECT add_job('insert_into_daily_data', '1 day', initial_start => '2024-02-20 18:31:00+00'::timestamptz);
`)

  },
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