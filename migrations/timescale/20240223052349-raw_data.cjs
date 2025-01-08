/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('metrics_raw_data', {
      id: {
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      org_id: {
        type: Sequelize.STRING
      },
      bridge_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      version_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      thread_id: {
        type: Sequelize.STRING
      },
      model: {
        type: Sequelize.STRING
      },
      input_tokens: {
        type: Sequelize.FLOAT
      },
      output_tokens: {
        type: Sequelize.FLOAT
      },
      total_tokens: {
        type: Sequelize.FLOAT
      },
      apikey_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      latency: {
        type: Sequelize.FLOAT
      },
      success: {
        type: Sequelize.BOOLEAN
      },
      cost : {
        type : Sequelize.FLOAT
      },
      service : {
        type : Sequelize.STRING
      },
      time_zone : {
        type : Sequelize.STRING
      }
    });
    await queryInterface.addIndex('metrics_raw_data', {
      fields: ['created_at', 'id'],
      unique: true,
      name: 'index_created_at_id_created_at'
    });    
    await queryInterface.sequelize.query("SELECT create_hypertable('metrics_raw_data', by_range('created_at', INTERVAL '1 hour'));");
  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('metrics_raw_data');
  }
};
