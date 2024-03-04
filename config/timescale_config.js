const dotenv = require('dotenv');


dotenv.config();

const timescaleServiceUrl = process.env.TIMESCALE_SERVICE_URL;

module.exports= {
  development: {
    url: timescaleServiceUrl,
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
  test: {
    url: timescaleServiceUrl,
    dialect: 'postgres',
  },
  production: {
    url: timescaleServiceUrl,
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
