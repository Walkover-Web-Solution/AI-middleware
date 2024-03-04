const { Model, DataTypes } = require('sequelize');


module.exports= (sequelize, DataTypes) => {
  class five_minute_data extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  five_minute_data.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    org_id: DataTypes.STRING,
    authkey_name: DataTypes.STRING,
    sum_latency: DataTypes.FLOAT,
    service: DataTypes.STRING,
    model: DataTypes.STRING,
    success_count: DataTypes.FLOAT,
    token_count: DataTypes.FLOAT,
    expected_cost_sum: DataTypes.FLOAT,
    record_count: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    created_at: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'five_minute_data',
    timestamps: false
  });
  return five_minute_data;
};
