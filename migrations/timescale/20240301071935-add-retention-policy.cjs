'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(` 
    SELECT add_retention_policy('raw_data', INTERVAL '1 day');`);
    await queryInterface.sequelize.query(` 
    SELECT add_retention_policy('five_minute_data', INTERVAL '1 month');`);
    await queryInterface.sequelize.query(` 
    SELECT add_retention_policy('daily_data', INTERVAL '1 month');`);
    await queryInterface.sequelize.query(` 
    SELECT add_retention_policy('five_min_data_aggregate', INTERVAL '1 day');`);
    await queryInterface.sequelize.query(` 
    SELECT add_retention_policy('daily_data_aggregate', INTERVAL '3 days');`);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
    SELECT remove_retention_policy('raw_data');
  `);
    await queryInterface.sequelize.query(`
    SELECT remove_retention_policy('five_minute_data');
   `);
    await queryInterface.sequelize.query(`
    SELECT remove_retention_policy('daily_data');
  `);
    await queryInterface.sequelize.query(`
    SELECT remove_retention_policy('five_min_data_aggregate');
   `);
    await queryInterface.sequelize.query(`
    SELECT remove_retention_policy('daily_data_aggregate');
   `);
  }
};