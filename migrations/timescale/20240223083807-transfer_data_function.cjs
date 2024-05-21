'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // eslint-disable-next-line no-unused-vars
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION insert_into_five_min_data(job_id int, config jsonb)
    RETURNS void LANGUAGE plpgsql AS
    $$
    BEGIN
      INSERT INTO five_minute_data 
          (org_id, authkey_name, service, model, 
           sum_latency,avg_latency, success_count,record_count, created_at, token_count,expected_cost_sum)
      SELECT 
          org_id, authkey_name, service, model, 
          sum_latency,avg_latency, success_count,record_count, interval, token_count,expected_cost_sum
      FROM five_min_data_aggregate
      WHERE interval > (SELECT COALESCE(MAX(created_at), 'epoch'::timestamp) FROM five_minute_data)
      ON CONFLICT (org_id, service, model, created_at)
      DO UPDATE SET
          sum_latency = five_minute_data.sum_latency + EXCLUDED.sum_latency,
          avg_latency = (five_minute_data.avg_latency * five_minute_data.record_count + EXCLUDED.avg_latency * EXCLUDED.record_count) / (five_minute_data.record_count + EXCLUDED.record_count),
          expected_cost_sum = five_minute_data.expected_cost_sum + EXCLUDED.expected_cost_sum,
          record_count = five_minute_data.record_count + EXCLUDED.record_count,
          token_count = five_minute_data.token_count + EXCLUDED.token_count,
          success_count = five_minute_data.success_count + EXCLUDED.success_count;
    END;
    $$;
    
  `);
    
  await queryInterface.sequelize.query(`
  SELECT add_job('insert_into_five_min_data', '5 minutes');
`)

  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    let jobId = 0;
    await queryInterface.sequelize.query(`
    SELECT job_id  as id
FROM timescaledb_information.jobs where proc_name like 'insert_into_five_min_data';
  `).then((result) => {
    jobId = result[0][0].id;
  });
    await queryInterface.sequelize.query(`
      DROP FUNCTION insert_into_five_min_data;
    `);
    if (jobId) {
      await queryInterface.sequelize.query(`
        SELECT delete_job(${jobId});
      `);
    }
  }
};
