import { Job } from 'bullmq';
import dayjs from 'dayjs';
import { Requests } from 'entities/Requests';
import { addJob, expiredRequestQueue } from 'queues/job_queue/producer';
import { changeRequestState } from 'request/manage';
import { sendInstantNotification } from 'services/notifications/handler';
import { NotificationRouteCode, RequestStatus } from 'types';

export const expireRequest = async (job: Job) => {
  try {
    const requestId: number = job.data;
    const request = await Requests.findOne({ where: { id: requestId } });
    if (!request) return;
    const status = request.status;
    if (status === RequestStatus.PENDING || status === RequestStatus.ACCEPTED) {
      const userId = request.customer;
      const messageTitle = 'Expired Request Alert 🛑';
      const messageBody = `Unfortunately ${request.celebrityAlias} missed the deadline to make your request 🥲😔. Your money will be refunded to you within the next 5 working days`;
      const route = NotificationRouteCode.DEFAULT;
      const result = await changeRequestState(request.id, RequestStatus.EXPIRED, status);
      if (result) {
        // trigger refund process here
        //write refund logic here
        await sendInstantNotification([userId], messageTitle, messageBody, route);
        await terminateRequest(result.id);
      }
    } else if (status === RequestStatus.EXPIRED) {
      //execute request termination
      await changeRequestState(request.id, RequestStatus.UNFULFILLED, RequestStatus.EXPIRED);
    }
  } catch (err) {
    console.error(err);
    return;
  }
};

export const terminateRequest = async (requestId: number) => {
  //change the request to unfulfilled after 24hrs
  const delay = dayjs().add(1, 'day').valueOf() - dayjs().valueOf();
  await addJob(expiredRequestQueue, 'request-termination', requestId, {
    attempts: 6,
    backoff: { type: 'fixed', delay: 30000 },
    delay,
    removeOnFail: true,
    removeOnComplete: true,
  });
};
