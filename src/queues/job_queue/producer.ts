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
export const alertsQueue = new Queue(config.ALERTS_QUEUE_NAME, {
  connection: redis,
});

(async () => {
  const datetime = new Date();
  //add job for daily request reminder
  await alertsQueue.add(config.REQUEST_REMINDER, '', {
    jobId: 'request-reminder',
    repeat: {
      pattern: '0 0 * * *', //everyday at midnight
      offset: datetime.getTimezoneOffset(),
      tz: 'Africa/Abidjan', //utc+0
    },
  });

  //add job for new celebrity alerts
  await alertsQueue.add(config.NEW_CELEBRITY_ALERT, '', {
    jobId: 'new-celebrity-alert',
    repeat: {
      pattern: '0 7 * * *', //everyday at 7am
      offset: datetime.getTimezoneOffset(),
      tz: 'Africa/Abidjan', //utc+0
    },
  });

  console.log('request reminder and new celebrity alert jobs added');
})();

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
