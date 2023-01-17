import { Job } from 'bullmq';
import dayjs from 'dayjs';
import AppDataSource from '../config/ormconfig';
import { Requests } from '../entities/Requests';
import { addJob, operationsQueue } from '../queues/job_queue/producer';
import { sendInstantNotification } from '../services/notifications/handler';
import { NotificationRouteCode, RequestStatus, RequestType, TransactionsMetadata } from '../types';

const processExpiredRequest = async (request: Requests) => {
  let delay: number;
  //execute job at request expiration time for shoutout requests
  if (request.requestType === RequestType.SHOUTOUT || request.requestType === RequestType.INSTANT_SHOUTOUT) {
    delay = request.requestExpires.getTime() - Date.now();
  }
  //execute job 5 minutes after initial call time for call requests
  else delay = request.callRequestBegins.getTime() + 300000 - Date.now();
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
      const messageBody = `Unfortunately ${request.celebrityAlias} missed the deadline to make your request 🥲😔. Your money will be refunded to you within the next 30 days`;
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
      console.log('Unfulfil job now');
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
    console.log('Updating request with Id: ', requestId);
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
    console.log(err);
    throw err;
  }
};

export const updateRequestAndNotify = async (metadata: TransactionsMetadata, success: boolean) => {
  let userId: string, messageTitle: string, messageBody: string;
  let route: NotificationRouteCode;
  const status = success ? RequestStatus.PENDING : RequestStatus.FAILED;
  const customer = metadata.userId;
  try {
    const request = (await (
      await Requests.createQueryBuilder()
        .update({ status })
        .where({ customer })
        .andWhere({ reference: metadata.reference })
        .returning('*')
        .execute()
    ).raw[0]) as Requests;

    const requestType =
      request.requestType === RequestType.SHOUTOUT || RequestType.INSTANT_SHOUTOUT ? 'shoutout' : 'video call';
    if (success) {
      //automagically check and update state of request on expiration
      await processExpiredRequest(request);
      //send notification
      userId = request.celebrity;
      messageTitle = 'New Request Alert! 🚨';
      messageBody = `You have received a new ${requestType} request`;
      route = NotificationRouteCode.RECEIVED_REQUEST;
    } else {
      userId = request.customer;
      messageTitle = `Failed ${requestType} Request 🛑`;
      messageBody = `Your request to ${request.celebrity} failed due to an issue in processing your payment 😔`;
      route = NotificationRouteCode.DEFAULT;
    }
    await sendInstantNotification([userId], messageTitle, messageBody, route);
  } catch (err) {
    console.error(err);
  }
};
