import { Requests } from "../entities/Requests";
import { addJob, operationsQueue } from "../queues/job_queue/producer";
import { sendInstantNotification } from "../services/notifications/handler";
import { NotificationRouteCode, RequestStatus, RequestType } from "../types";

export const processExpiredRequest = async (request: Requests) => {
  let delay: number;
  //execute job at request expiration time for shoutout requests
  if (request.requestType === RequestType.SHOUTOUT) delay = request.requestExpires.getTime() - Date.now();
  //execute job 5 minutes after initial call time for call requests
  else delay = request.callRequestBegins.getTime() + 300000 - Date.now();
  await addJob(operationsQueue, "requests-op", request.id, {
    attempts: 6,
    backoff: { type: "fixed", delay: 10000 },
    delay,
    removeOnFail: true,
    removeOnComplete: true,
  });
};

export const changeRequestState = async (requestId: number, status: RequestStatus) => {
  try {
    await Requests.update(requestId, { status });
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const updateRequestAndNotify = async (paymentRef: string, success: boolean) => {
  let userId: string, messageTitle: string, messageBody: string;
  let route: NotificationRouteCode;
  const status = success ? RequestStatus.PENDING : RequestStatus.FAILED;
  try {
    const request = await (
      await Requests.createQueryBuilder()
        .update({ status })
        .where({ paymentRef })
        .returning('id, requestor, recipient, callRequestBegins, requestExpires, "requestType"')
        .execute()
    ).raw[0];
    const requestType = request.requestType === RequestType.SHOUTOUT ? "shoutout" : "video call";
    if (success) {
      //automagically check and update state of request on expiration
      await processExpiredRequest(request);
      //send notification
      userId = request.recipient;
      messageTitle = "New Request Alert! 💪🏾";
      messageBody = `You have received a new ${requestType} request`;
      route = NotificationRouteCode.RECEIVED_REQUEST;
    } else {
      userId = request.requestor;
      messageTitle = `Failed ${requestType} Request`;
      messageBody = `Your request to ${request.recipient} failed due to an issue in processing your payment 😔`;
      route = NotificationRouteCode.RESPONSE;
    }
    sendInstantNotification([userId], messageTitle, messageBody, route);
  } catch (err) {
    console.error(err);
  }
};
