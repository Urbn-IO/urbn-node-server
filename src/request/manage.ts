import AppDataSource from 'config/ormconfig';
import { config, REQUEST_REMINDER_PREFIX } from 'constant';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { Requests } from 'entities/Requests';
import { addJob, expiredRequestQueue, requestReminderQueue } from 'queues/job_queue/producer';
import redisClient from 'redis/client';
import { sendInstantNotification } from 'services/notifications/handler';
import { DeepPartial } from 'typeorm';
import { NotificationRouteCode, RequestStatus, RequestType, SubscriptionTopics } from 'types';
import { VerifyPaymentResponse } from 'utils/graphqlTypes';
import { replacer, reviver } from 'utils/helpers';
import publish from 'utils/publish';
dayjs.extend(utc);

const redis = redisClient;

const setupExpiration = async (request: Requests) => {
  //execute job at request expiration time for shoutout requests
  const date = dayjs.utc(request.requestExpires); //request Expires is returned as a string for some reason, check why later
  const delay = date.valueOf() - dayjs.utc().valueOf();
  const requestId = request.id;
  await addJob(expiredRequestQueue, 'request-expiration', requestId, {
    attempts: 6,
    backoff: { type: 'fixed', delay: 30000 },
    delay,
    removeOnFail: true,
    removeOnComplete: true,
  });
};

export const setupCallReminder = async (request: Requests) => {
  //notify user about call 30mins before the call start time
  const callStartTime = request.callRequestBegins;
  const delay = dayjs.utc(callStartTime).subtract(30, 'minute').valueOf() - dayjs.utc().valueOf();
  await addJob(requestReminderQueue, config.CALL_REMINDER_JOB, request, {
    attempts: 6,
    backoff: { type: 'fixed', delay: 60000 },
    delay,
    removeOnFail: true,
    removeOnComplete: true,
  });
};

export const setupRequestReminder = async (request: Requests) => {
  //notify celebrities at the beginning of the day about requests they have for that day
  const celeb = request.celebrity;
  const requestDay = dayjs.utc(request.requestExpires).format('DD-MM-YY');
  const key = REQUEST_REMINDER_PREFIX + requestDay;
  const expireTime = dayjs.utc(request.requestExpires).set('hour', 1).set('minute', 0).set('second', 0); //delete reminder from cache 1 hour after midnight (notifications should have fired by then)
  //check if celeb already has requests for that day, increase count of requests else create cache for request
  const res = await redis.get(key);
  if (res) {
    const data: Map<string, number> = JSON.parse(res, reviver);
    const currentCount = data.get(celeb);
    const count = currentCount ? currentCount + 1 : 1; //count is the number of requests the celebrity has expiring for that day, the total should be reduced when a request is fulfilled before the expiration date
    data.set(celeb, count);
    await redis.set(key, JSON.stringify(data, replacer), 'EXAT', expireTime.unix());
  } else {
    const isToday = dayjs.utc().isSame(expireTime, 'day');
    if (isToday) return;
    const data = new Map<string, number>();
    data.set(celeb, 1);
    await redis.set(key, JSON.stringify(data, replacer), 'EXAT', expireTime.unix());
  }
};

export const removeRequestReminder = async (requests: Requests[]) => {
  for (const request of requests) {
    const requestDay = dayjs.utc(request.requestExpires).format('DD-MM-YY');
    const expireTime = dayjs.utc(request.requestExpires).set('hour', 1).set('minute', 0).set('second', 0); //delete reminder from cache 1 hour after midnight (notifications should have fired by then)
    const isToday = dayjs.utc().isSame(expireTime, 'day');
    if (isToday) continue;
    const key = REQUEST_REMINDER_PREFIX + requestDay;
    const celeb = request.celebrity;
    const res = await redis.get(key);
    if (!res) return;
    const data: Map<string, number> = JSON.parse(res, reviver);
    const currentCount = data.get(celeb) as number; //potentially dangerous, count guaranteed to have value now, changed to setupRequestReminder should be treated with caution
    if (currentCount > 1) {
      const count = currentCount - 1;
      data.set(celeb, count);
    } else {
      data.delete(celeb);
    }

    await redis.set(key, JSON.stringify(data, replacer), 'EXAT', expireTime.unix());
  }
};

export const changeRequestState = async (
  requestId: number,
  status: RequestStatus,
  prevStatus?: RequestStatus | null
): Promise<Requests> => {
  try {
    const result = await AppDataSource.query(
      `
    UPDATE Requests
    SET    status = $1, "prevStatus" = $2
    WHERE  id = $3
    RETURNING *; 
    `,
      [status, prevStatus, requestId]
    );
    const request = result[0];
    return request[0];
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const updateRequestAndNotify = async (data: DeepPartial<Requests>, success: boolean) => {
  let userId: string, messageTitle: string, messageBody: string;
  let route: NotificationRouteCode;
  try {
    const requestType =
      data.requestType === (RequestType.SHOUTOUT || RequestType.INSTANT_SHOUTOUT) ? 'shoutout' : 'video call';
    if (success) {
      const request = await Requests.save(data);
      //notify client about successful payment
      publish<VerifyPaymentResponse>(SubscriptionTopics.Verify_Payment, {
        userId: request.customer,
        status: true,
      });
      //automagically check and update state of request on expiration
      await setupExpiration(request);

      //send notification
      userId = request.celebrity;
      messageTitle = 'New Request Alert! 🚨';
      messageBody = `You have received a new ${requestType} request`;
      route = NotificationRouteCode.RECEIVED_REQUEST;
    } else {
      userId = data.customer as string;
      messageTitle = `Failed ${requestType} Request 🛑`;
      messageBody = `Your request to ${data.celebrity} failed due to an issue in processing your payment 😔`;
      route = NotificationRouteCode.DEFAULT;
    }
    await sendInstantNotification([userId], messageTitle, messageBody, route);
  } catch (err) {
    console.error(err);
  }
};
