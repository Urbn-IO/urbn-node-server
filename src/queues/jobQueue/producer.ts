import { JobsOptions, Queue, QueueScheduler } from "bullmq";
import IORedis from "ioredis";
import { UpdateCallDurationArgs } from "../../types";

export const createQueue = (queueName: string, redis: IORedis.Redis) => {
  new QueueScheduler(queueName, { connection: redis });
  const queue = new Queue(queueName, {
    connection: redis,
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

export const addJob = async (queue: Queue<any, any, string>, jobName: string, id: string, jobOptions?: JobsOptions) => {
  const data: UpdateCallDurationArgs = { roomSid: id };
  await queue.add(jobName, data, jobOptions);
  console.log(`${jobName} was added`);
  return true;
};
