import Redis, { RedisOptions } from "ioredis";

const options: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  maxRetriesPerRequest: null,
};
const redisClient = new Redis(options);

export default redisClient;
