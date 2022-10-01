import { Job } from "bullmq";
import { Requests } from "../../../entities/Requests";
import { sendInstantNotification } from "../../../services/notifications/handler";
import { NotificationRouteCode, RequestStatus } from "../../../types";

const expireRequest = async ({ id, requestor, recipientAlias }: Requests) => {
  const request = await Requests.findOne({ where: { id }, select: ["status"] });
  if (!request) return;
  const status = request.status;
  if (status === RequestStatus.PENDING || status === RequestStatus.ACCEPTED) {
    const userId = requestor;
    const messageTitle = "Expired Request Alert 🛑";
    const messageBody = `Unfortunately ${recipientAlias} missed the deadline to make your request 🥲😔. Your money will be refunded to you within the next 30 days`;
    const route = NotificationRouteCode.RESPONSE;
    await Requests.update(id, { status: RequestStatus.UNFULFILLED });
    await sendInstantNotification([userId], messageTitle, messageBody, route);
  }
};

export default async (job: Job<Requests>) => await expireRequest(job.data);
