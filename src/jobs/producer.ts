import { JobsOptions, Queue, QueueScheduler } from "bullmq";
import IORedis from "ioredis";
import { CallbackFunction } from "../types";

export const createQueue = (queueName: string, redis: IORedis.Redis) => {
  new QueueScheduler(queueName, { connection: redis });
  const queue = new Queue(queueName, {
    connection: redis,
  });
  console.log(`${queueName} queue created `);
  return queue;
};

export const addJob = async (
  queue: Queue<any, any, string>,
  jobName: string,
  id: string,
  callBack: CallbackFunction,
  jobOptions?: JobsOptions
) => {
  await queue.add(jobName, { id, callBack }, jobOptions);
  console.log(`${jobName} was added`);
  return true;
};
