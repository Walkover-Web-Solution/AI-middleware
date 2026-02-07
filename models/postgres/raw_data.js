// eslint-disable-next-line no-unused-vars
import { Model, DataTypes } from "sequelize";
export default (sequelize, DataTypes) => {
  class raw_data extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      raw_data.belongsTo(models.conversations, {
        foreignKey: "chat_id",
        as: "conversation"
      });
    }
  }
  raw_data.init(
    {
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
        allowNull: false
      },
      error: {
        type: DataTypes.TEXT,
        defaultValue: "none"
      },
      model: DataTypes.STRING,
      input_tokens: DataTypes.FLOAT,
      output_tokens: DataTypes.FLOAT,
      expected_cost: DataTypes.FLOAT,
      message_id: DataTypes.UUIDV4,
      created_at: DataTypes.DATE,
      chat_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "conversations",
          key: "id"
        }
      },
      variables: DataTypes.JSON,
      is_present: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: "raw_data",
      timestamps: false
    }
  );
  return raw_data;
};
