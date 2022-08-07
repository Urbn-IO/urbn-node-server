import { JobsOptions, Queue, QueueScheduler } from "bullmq";
import IORedis from "ioredis";

export const createQueue = (queueName: string, redis: IORedis.Redis, defaultOptions = true) => {
  let defaultJobOptions: JobsOptions | undefined;
  if (defaultOptions) {
    defaultJobOptions = {
      attempts: 10,
      backoff: { type: "exponential", delay: 60000 },
    };
  }
  new QueueScheduler(queueName, { connection: redis });
  const queue = new Queue(queueName, {
    connection: redis,
    defaultJobOptions,
  });
  console.log(`${queueName} queue created `);
  return queue;
};

export const destroyJob = async (queue: Queue<any, any, string>, jobId: string, repeatable = false) => {
  if (repeatable) {
    const repeatableJobs = await queue.getRepeatableJobs();
    const key = repeatableJobs.map((x) => {
      if (x.key.includes(jobId)) return x.key;
      return "";
    })[0];
    await queue.removeRepeatableByKey(key);
  }
};

export const addJob = async <T>(queue: Queue<any, any, string>, jobName: string, data: T, jobOptions?: JobsOptions) => {
  await queue.add(jobName, data, jobOptions);
  console.log(`${jobName} was added`);
  return true;
};
