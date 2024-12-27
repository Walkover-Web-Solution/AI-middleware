import dotenv from "dotenv";
dotenv.config();
const timescaleServiceUrl = process.env.TIMESCALE_SERVICE_URL;
export default {
  development: {
    url: timescaleServiceUrl,
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  },
  test: {
    url: "",
    dialect: 'postgres'
  },
  production: {
    url: timescaleServiceUrl,
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};