import dotenv from "dotenv";
dotenv.config();
// const timescaleServiceUrl = process.env.TIMESCALE_SERVICE_URL;
export default {
  development: {
    url: "postgresql://tsdbadmin:wiu3nrnmhljj26z5@cnd9mf6ofq.x5aoank8hh.tsdb.cloud.timescale.com:35241/tsdb?sslmode=require",
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
    url: "postgresql://tsdbadmin:wiu3nrnmhljj26z5@cnd9mf6ofq.x5aoank8hh.tsdb.cloud.timescale.com:35241/tsdb?sslmode=require",
    dialect: 'postgres'
  },
  production: {
    url: "postgresql://tsdbadmin:wiu3nrnmhljj26z5@cnd9mf6ofq.x5aoank8hh.tsdb.cloud.timescale.com:35241/tsdb?sslmode=require",
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