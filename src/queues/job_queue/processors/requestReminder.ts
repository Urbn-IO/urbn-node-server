import { Job } from 'bullmq';
import { config, REQUEST_REMINDER_PREFIX } from 'constant';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Requests } from 'entities/Requests';
import redisClient from 'redis/client';
import { sendInstantNotification } from 'services/notifications/handler';
import { reviver } from 'utils/helpers';
dayjs.extend(utc);

export const requestReminder = async (job: Job) => {
  if (job.name === config.CALL_REMINDER_JOB) {
    const request: Requests = job.data;
    const userId = request.customer;
    await sendInstantNotification(
      [userId],
      'Video call in 30 mins! 📞',
      `You have a video call session with ${request.celebrityAlias} in about 30 minutes. Get ready!`
    );
  } else {
    const redis = redisClient;
    const day = dayjs.utc().format('DD-MM-YY');
    const key = REQUEST_REMINDER_PREFIX + day;
    const res = await redis.get(key);
    if (res) {
      const data: Map<string, number> = JSON.parse(res, reviver);
      const celebIds = [...data.keys()];
      await sendInstantNotification(
        celebIds,
        'You have requests expiring in less than 24hrs 🛟',
        'Some requests you accepted are expiring soon, check them out before they expire'
      );
      await redis.del(key);
    }
  }
};
