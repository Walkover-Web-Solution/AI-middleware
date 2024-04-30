const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class System_prompt_versioning extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  System_prompt_versioning.init({
    created_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    system_prompt: {
      allowNull: false,
      type: DataTypes.TEXT
    },
    bridge_id: {
      allowNull: false,
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'System_prompt_versioning',
    timestamps: false
  });

  return System_prompt_versioning;
};
