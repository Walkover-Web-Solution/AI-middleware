const { Model, DataTypes } = require('sequelize');

module.exports= (sequelize, DataTypes) => {
  class raw_data extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  raw_data.init({
    id: {
      allowNull: false,
      type: DataTypes.UUID,
      primaryKey: true, 
      defaultValue: DataTypes.UUIDV4
    },
    org_id: DataTypes.STRING,
    authkey_name: DataTypes.STRING,
    latency: DataTypes.FLOAT,
    service: DataTypes.STRING,
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    error:{
      type:DataTypes.STRING,
      defaultValue:'none'
    },
    model: DataTypes.STRING,
    input_tokens: DataTypes.FLOAT,
    output_tokens: DataTypes.FLOAT,
    expected_cost: DataTypes.FLOAT,
    created_at: DataTypes.DATE,
  }, {
    sequelize,
    modelName: 'raw_data',
    timestamps: false
  });
  return raw_data;
};