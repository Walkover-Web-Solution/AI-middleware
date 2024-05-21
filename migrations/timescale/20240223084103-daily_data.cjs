/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable("daily_data", {
      id: {
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      org_id: {
        type: Sequelize.STRING
      },
      authkey_name: {
        type: Sequelize.STRING, 
        allowNull: true        
      },
      avg_latency: {
        type: Sequelize.FLOAT 
      },
      service: {
        type: Sequelize.STRING
      },
      model: {
        type: Sequelize.STRING
      },
      token_count: {
        type: Sequelize.FLOAT
      },
      expected_cost_sum: {
        type: Sequelize.FLOAT
      },
      success_count: {
        type: Sequelize.FLOAT,
      },
      record_count: {
        type: Sequelize.FLOAT,
        defaultValue: 0,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },

    });
    await queryInterface.addIndex('daily_data', {
      fields: ['id', 'created_at'],
      unique: true,
      name: 'daily_data_index_id_created_at',
    });
   
    await queryInterface.sequelize.query(
      "SELECT create_hypertable('daily_data', 'created_at');"
    );
    await queryInterface.addIndex("daily_data", {
      fields: ["org_id", "service", "model","created_at"],
      unique: true,
      name: 'unique_constraint_daily_org_service_model_created_at',
    });

  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("daily_data");
  },
};