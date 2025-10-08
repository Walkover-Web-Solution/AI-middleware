'use strict';

import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class orchestrator_history extends Model {
    static associate(models) {
      // we can define associations here, avi to kuch nhi h.
    }
  }

  orchestrator_history.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    org_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    thread_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sub_thread_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    model_name: {
      type: DataTypes.JSON,
      allowNull: false
    },
    orchestrator_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    user: {
      type: DataTypes.JSON,
      allowNull: false
    },
    response: {
      type: DataTypes.JSON,
      allowNull: true
    },
    tool_call_data: {
      type: DataTypes.JSON,
      allowNull: true
    },
    latency: {
      type: DataTypes.JSON,
      allowNull: true
    },
    tokens: {
      type: DataTypes.JSON,
      allowNull: true
    },
    error: {
      type: DataTypes.JSON,
      allowNull: true
    },
    variables: {
      type: DataTypes.JSON,
      allowNull: true
    },
    image_urls: {
      type: DataTypes.ARRAY(DataTypes.JSON),
      allowNull: true
    },
    ai_config: {
      type: DataTypes.JSON,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'createdAt'
    }
  }, {
    sequelize,
    modelName: 'orchestrator_history',
    tableName: 'orchestrator_history',
    timestamps: true,
    updatedAt: false,
  });

  return orchestrator_history;
};
