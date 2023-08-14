import { Job } from 'bullmq';
import { config, NEW_CELEBRITY_ALERT_PREFIX, REQUEST_REMINDER_PREFIX } from 'constant';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Celebrity } from 'entities/Celebrity';
import { Requests } from 'entities/Requests';
import redisClient from 'redis/client';
import { sendInstantNotification, sendInstantNotificationToTopic } from 'services/notifications/handler';
import { In } from 'typeorm';
import { consumeBatchedData, reviver } from 'utils/helpers';
dayjs.extend(utc);

const sortByPopularityIndexDescending = <T extends Pick<Celebrity, 'popularityIndex'>>(a: T, b: T) => {
  return b.popularityIndex - a.popularityIndex;
};

const callReminder = async (job: Job) => {
  const request: Requests = job.data;
  const userId = request.customer;
  await sendInstantNotification(
    [userId],
    'Video call in 30 mins! 📞',
    `You have a video call session with ${request.celebrityAlias} in about 30 minutes. Get ready!`
  );
};

const requestReminder = async () => {
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
};

const composeNewCelebritiesAlertMessage = (celebs: Pick<Celebrity, 'alias' | 'thumbnail'>[]) => {
  let message = '';
  const numOfCelebs = celebs.length;
  const headliner = celebs[0];
  const imageUrl = headliner.thumbnail;
  if (numOfCelebs === 1) {
    message = `${headliner.alias} just joined Urbn!🎉`;
    return { message, imageUrl };
  }
  if (numOfCelebs === 2) {
    message = `${headliner.alias} and ${celebs[1].alias} just joined Urbn🎉 Check them out!`;
    return { message, imageUrl };
  }
  if (numOfCelebs === 3) {
    message = `${headliner.alias}, ${celebs[1].alias} and ${celebs[2].alias} just joined Urbn🎉 Check them out!`;
    return { message, imageUrl };
  }
  if (numOfCelebs > 3) {
    message = `${headliner.alias}, ${celebs[1].alias} and ${numOfCelebs - 2} others just joined Urbn🎉 Check them out!`;
    return { message, imageUrl };
  }
  return;
};

const newCelebrityAlert = async () => {
  const redis = redisClient;
  const key = NEW_CELEBRITY_ALERT_PREFIX;
  const data = await consumeBatchedData<number>(redis, key);
  if (!data || data.length === 0) return;
  const celebs = await Celebrity.find({ where: { id: In(data) }, select: ['alias', 'thumbnail', 'popularityIndex'] });
  celebs.sort(sortByPopularityIndexDescending);
  const alert = composeNewCelebritiesAlertMessage(celebs);
  if (!alert) return;
  await sendInstantNotificationToTopic({ messageBody: alert.message, imageUrl: alert.imageUrl, topic: 'General' });
};

export const alerts = async (job: Job) => {
  try {
    switch (job.name) {
      case config.CALL_REMINDER_JOB:
        await callReminder(job);
        break;
      case config.REQUEST_REMINDER:
        await requestReminder();
        break;
      case config.NEW_CELEBRITY_ALERT:
        await newCelebrityAlert();
        break;
      default:
        break;
    }
  } catch (err) {
    console.log('error occured during alert creation: ', err);
  }
};
