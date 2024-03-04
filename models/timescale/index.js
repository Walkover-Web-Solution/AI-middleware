'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../config/timescale_config.js')[env];
const db = {};

try { 
  const sequelize = new Sequelize(process.env.TIMESCALE_SERVICE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    port: 35362,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: console.log
  });

  const dbservice = async () => {
    try {
      await sequelize.sync();
      console.log('Connection of timescale has been established successfully.', 2);
    } catch (error) {
      console.error('Unable to connect to the database:', error, 444);
    }
  };
  dbservice();

  fs
    .readdirSync(__dirname)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
      );
    })
    .forEach(file => {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });

  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;
} catch (error) {
  console.log('Error while connecting to the Timescaledb:',error);
}
 
module.exports = db;
