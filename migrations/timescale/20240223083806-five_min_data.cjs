/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable("fifteen_minute_data", {
      id: {
        allowNull: false,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      org_id: {
        type: Sequelize.STRING
      },
      bridge_id:{
        type: Sequelize.STRING,
        allowNull: true
      },
      version_id : {
        type: Sequelize.STRING,
        allowNull: true
      },
      thread_id : {
        type: Sequelize.STRING,
        allowNull: true
      },
      apikey_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      latency_sum: {
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
      total_token_count: {
        type: Sequelize.FLOAT
      },
      cost_sum: {
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
      time_zone : {
        type : Sequelize.STRING
      }

    });
    await queryInterface.addIndex('fifteen_minute_data', {
      fields: ['id', 'created_at'],
      unique: true,
      name: 'fifteen_minute_data_index_id_created_at',
    });

    await queryInterface.sequelize.query(
      "SELECT create_hypertable('fifteen_minute_data',by_range('created_at', INTERVAL '1 hour'));"
    );
    await queryInterface.addIndex("fifteen_minute_data", {
      fields: ["org_id", "service","bridge_id","version_id","thread_id","apikey_id" ,"model", "created_at"],
      unique: true,
      name: 'unique_constraint_org_service_model_created_at',
    });

  },
  // eslint-disable-next-line no-unused-vars
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("fifteen_minute_data");
  },
};