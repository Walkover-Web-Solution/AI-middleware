import { createLogger, format, transports } from "winston";

const { timestamp, combine, printf, colorize } = format;
const SERVICE_NAME = process.env.SERVICE_NAME || "dev-gtwy.ai";

// const LEVELS = {
//   error: 0,
//   warn: 1,
//   info: 2,
//   http: 3,
//   verbose: 4,
//   debug: 5,
//   silly: 6
// };

function buildDevLogger(logLevel = "http") {
  const localLogFormat = printf(({ level, message, timestamp, stack }) => `${timestamp} ${level} ${stack || message}`);

  return createLogger({
    level: logLevel,
    format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), format.errors({ stack: true }), localLogFormat),
    defaultMeta: SERVICE_NAME,
    transports: [new transports.Console()]
  });
}

function buildProdLogger(logLevel = "http") {
  return createLogger({
    level: logLevel,
    format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), format.errors({ stack: true }), format.json()),
    defaultMeta: { service: SERVICE_NAME },
    transports: [
      new transports.Console()
      //   new transports.File({ filename: `logs/log_${formattedDate}.log` }),
    ]
  });
}
const logger = () => {
  if (process.env.NODE_ENV === "development") {
    return buildDevLogger(process.env.LOG_LEVEL);
  }

  return buildProdLogger(process.env.LOG_LEVEL);
};

export default logger();
