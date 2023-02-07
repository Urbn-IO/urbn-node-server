import { JobsOptions, Queue } from 'bullmq';
import { config } from 'constant';
import redisClient from 'redis/client';

const redis = redisClient;

export const callStatusQueue = new Queue(config.CALL_QUEUE_NAME, {
  connection: redis,
});
export const mailQueue = new Queue(config.MAIL_QUEUE_NAME, {
  connection: redis,
});
export const expiredRequestQueue = new Queue(config.REQUEST_EXPIRATION_QUEUE_NAME, {
  connection: redis,
});
export const requestReminderQueue = new Queue(config.REQUEST_REMINDER_QUEUE_NAME, {
  connection: redis,
});

export const destroyRepeatableJob = async (queue: Queue<unknown, unknown, string>, jobId: string) => {
  const repeatableJobs = await queue.getRepeatableJobs();
  const key = repeatableJobs.map((x) => {
    if (x.key.includes(jobId)) return x.key;
    return null;
  })[0];
  if (key) await queue.removeRepeatableByKey(key);
};

export const addJob = async <T>(
  queue: Queue<unknown, unknown, string>,
  jobName: string,
  data: T,
  jobOptions?: JobsOptions
) => {
  await queue.add(jobName, data, jobOptions);
  console.log(`${jobName} was added`);
};
