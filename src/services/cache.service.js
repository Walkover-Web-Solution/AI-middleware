import { createClient } from "redis";

const client = createClient({
  url: process.env.REDIS_URI,
  socket: {
    reconnectStrategy: (retries) => retries * 1000,
  },
});

client.on("error", (error) => {
  console.error("Redis:", error);
});

client.on("ready", () => {
  console.log("Redis is ready");
});

client.connect();

export default client;
