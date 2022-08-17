import { Worker } from "bullmq";
import Redis from "ioredis";
import { config } from "../../constants";

const createWorker = (queueName: string, pathToProcessor: string, redis: Redis) => {
  const worker = new Worker(queueName, pathToProcessor, {
    connection: redis,
    sharedConnection: true,
    concurrency: config.BULL_QUEUE_CONCURRENCY,
  });
  return worker;
};

export default createWorker;
