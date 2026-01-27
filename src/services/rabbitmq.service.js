import logger from "../logger.js";
import EventEmitter from "events";
import amqp from "amqplib";
import { configDotenv } from "dotenv";

configDotenv();
const RABBIT_CONNECTION_STRING = process.env.QUEUE_CONNECTIONURL || "";
const RETRY_INTERVAL = 5000; // in millis

export function delay(time = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(true), time);
  });
}

class RabbitConnection extends EventEmitter {
  static instance;

  gracefulClose = false;

  connectionString;

  connection;

  constructor(connectionString) {
    super();
    if (!connectionString) throw new Error("connectionString is required");
    this.connectionString = connectionString;
    this.setupConnection();
  }

  static getSingletonInstance(connectionString) {
    RabbitConnection.instance ||= new RabbitConnection(connectionString);
    return RabbitConnection.instance;
  }

  status() {
    return !!this.connection;
  }

  async setupConnection() {
    try {
      this.gracefulClose = false;
      const connection_name = `${process.env.NODE_ENV} - ${process.env.CONSUMER_ENABLED}`;
      this.connection = await amqp.connect(this.connectionString, { clientProperties: { connection_name } });
      this.initEventListeners();
      return this.connection;
    } catch (err) {
      logger.error("[RABBIT](setupConnection)", err);
      this.emit("retry");
      await delay(RETRY_INTERVAL);
      return this.setupConnection();
    }
  }

  initEventListeners() {
    if (!this.connection) return;
    logger.info(`[RABBIT](onConnectionReady) Connection established to ${this.connectionString}`);
    this.emit("connect", this.connection);

    this.connection.on("close", (error) => {
      this.connection = undefined;

      if (this.gracefulClose) {
        logger.info("[RABBIT](onConnectionClosed) Gracefully");
        this.emit("gracefulClose");
      } else {
        logger.error("[RABBIT](onConnectionClosed) Abruptly", error);
        try {
          this.emit("error", error);
        } catch (error) {
          console.log("error in emitting error", error);
        }
      }
      if (!this.gracefulClose) this.setupConnection();
    });
  }

  closeConnection() {
    if (this.connection) {
      this.gracefulClose = true;
      logger.info("[RABBIT](closeConnection) Closing connection...");
      this.connection.close();
    }
  }
}

export default (connectionString) =>
  RabbitConnection.getSingletonInstance(connectionString || RABBIT_CONNECTION_STRING);
