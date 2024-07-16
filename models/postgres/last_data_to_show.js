// 'use strict';
import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class last_data_to_show extends Model {
  }
  last_data_to_show.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    thread_id: DataTypes.STRING,
    data: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'last_data_to_show',
    tableName: 'last_data_to_show' 
  });
  return last_data_to_show;
};