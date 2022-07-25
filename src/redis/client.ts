import Redis, { RedisOptions } from "ioredis";

const redisClient = async () => {
  const options: RedisOptions = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
  };
  return new Redis(options);
};

export default redisClient;
