import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis, { RedisOptions } from 'ioredis';

const options: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});

export default pubsub;
