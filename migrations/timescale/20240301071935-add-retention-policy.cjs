"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // eslint-disable-next-line no-unused-vars
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(` 
    SELECT add_retention_policy('metrics_raw_data', INTERVAL '1 day');`);
    await queryInterface.sequelize.query(` 
    SELECT add_retention_policy('fifteen_minute_data', INTERVAL '1 day');`);
    await queryInterface.sequelize.query(` 
    SELECT add_retention_policy('daily_data', INTERVAL '1 year');`);
    await queryInterface.sequelize.query(` 
    SELECT add_retention_policy('fifteen_min_data_aggregate', INTERVAL '1 day');`);
    await queryInterface.sequelize.query(` 
    SELECT add_retention_policy('daily_data_aggregate', INTERVAL '3 days');`);
  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
    SELECT remove_retention_policy('metrics_raw_data');
  `);
    await queryInterface.sequelize.query(`
    SELECT remove_retention_policy('fifteen_minute_data');
   `);
    await queryInterface.sequelize.query(`
    SELECT remove_retention_policy('daily_data');
  `);
    await queryInterface.sequelize.query(`
    SELECT remove_retention_policy('fifteen_min_data_aggregate');
   `);
    await queryInterface.sequelize.query(`
    SELECT remove_retention_policy('daily_data_aggregate');
   `);
  }
};
