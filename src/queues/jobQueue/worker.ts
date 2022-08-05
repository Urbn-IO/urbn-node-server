import { Worker } from "bullmq";
import IORedis from "ioredis";
import config from "../../config";

const createWorker = (queueName: string, pathToProcessor: string, redis: IORedis.Redis) => {
  const worker = new Worker(queueName, pathToProcessor, {
    connection: redis,
    sharedConnection: true,
    concurrency: config.BULL_QUEUE_CONCURRENCY,
  });
  return worker;
};

export default createWorker;
