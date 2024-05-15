/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable("five_minute_data", {
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
      sum_latency: {
        type: Sequelize.FLOAT
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
      success_count: {
        defaultValue: 0,
        type: Sequelize.FLOAT
      },
      token_count: {
        type: Sequelize.FLOAT
      },
      expected_cost_sum: {
        type: Sequelize.FLOAT
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
    await queryInterface.addIndex('five_minute_data', {
      fields: ['id', 'created_at'],
      unique: true,
      name: 'five_minute_data_index_id_created_at',
    });

    await queryInterface.sequelize.query(
      "SELECT create_hypertable('five_minute_data', 'created_at');"
    );
    await queryInterface.addIndex("five_minute_data", {
      fields: ["org_id", "service", "model", "created_at"],
      unique: true,
      name: 'unique_constraint_org_service_model_created_at',
    });

  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("five_minute_data");
  },
};