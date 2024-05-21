// eslint-disable-next-line no-unused-vars
import { Model, DataTypes } from "sequelize";
export default ((sequelize, DataTypes) => {
  class daily_data extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // eslint-disable-next-line no-unused-vars
    static associate(models) {
      // define association here
    }
  }
  daily_data.init({
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
    token_count: DataTypes.FLOAT,
    success_count: DataTypes.FLOAT,
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
    modelName: 'daily_data',
    timestamps: false
  });
  return daily_data;
});