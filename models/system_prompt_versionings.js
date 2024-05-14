const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class system_prompt_versionings extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  system_prompt_versionings.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
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
    },
    org_id: {
        allowNull: false,
        type: DataTypes.STRING
      }
  }, {
    sequelize,
    modelName: "system_prompt_versionings",
    timestamps: false
  });

  return system_prompt_versionings;
};
