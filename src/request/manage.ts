import { Job } from 'bullmq';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { DeepPartial } from 'typeorm';
import AppDataSource from '../config/ormconfig';
import { Requests } from '../entities/Requests';
import { addJob, operationsQueue } from '../queues/job_queue/producer';
import { sendInstantNotification } from '../services/notifications/handler';
import { NotificationRouteCode, RequestStatus, RequestType, SubscriptionTopics } from '../types';
import { VerifyPaymentResponse } from '../utils/graphqlTypes';
import publish from '../utils/publish';
dayjs.extend(utc);

const setupExpiration = async (request: Requests) => {
  //execute job at request expiration time for shoutout requests
  const date = dayjs.utc(request.requestExpires); //request Expires is returned as a string for some reason, check why later
  const delay = date.valueOf() - dayjs.utc().valueOf();
  await addJob(operationsQueue, 'requests-op', request, {
    attempts: 6,
    backoff: { type: 'fixed', delay: 30000 },
    delay,
    removeOnFail: true,
    removeOnComplete: true,
  });
};

export const expireRequest = async (job: Job) => {
  try {
    const request: Requests = job.data;
    const status = request.status;
    if (status === RequestStatus.PENDING || status === RequestStatus.ACCEPTED) {
      const userId = request.customer;
      const messageTitle = 'Expired Request Alert 🛑';
      const messageBody = `Unfortunately ${request.celebrityAlias} missed the deadline to make your request 🥲😔. Your money will be refunded to you within the next 5 working days`;
      const route = NotificationRouteCode.DEFAULT;
      const prevStatus = status === RequestStatus.ACCEPTED ? RequestStatus.ACCEPTED : null;
      const result = await changeRequestState(request.id, RequestStatus.EXPIRED, prevStatus);
      if (result) {
        // trigger refund process here
        //write refund logic here

        await sendInstantNotification([userId], messageTitle, messageBody, route);
        //change the request to unfulfilled after 24hrs
        const delay = dayjs().add(1, 'day').valueOf() - dayjs().valueOf();
        await addJob(operationsQueue, 'requests-op', result, {
          attempts: 6,
          backoff: { type: 'fixed', delay: 30000 },
          delay,
          removeOnFail: true,
          removeOnComplete: true,
        });
      }
    } else if (status === RequestStatus.EXPIRED) {
      await changeRequestState(request.id, RequestStatus.UNFULFILLED);
    }
  } catch (err) {
    console.error(err);
    return;
  }
};

export const changeRequestState = async (
  requestId: number,
  status: RequestStatus,
  prevStatus?: RequestStatus | null
) => {
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
      data.requestType === RequestType.SHOUTOUT || RequestType.INSTANT_SHOUTOUT ? 'shoutout' : 'video call';
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
