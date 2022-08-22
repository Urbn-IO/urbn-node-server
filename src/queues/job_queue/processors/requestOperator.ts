import { Job } from "bullmq";
import { Requests } from "../../../entities/Requests";
import { RequestStatus } from "../../../types";

const expireRequest = async ({ id }: Requests) => {
  const request = await Requests.findOne({ where: { id }, select: ["status"] });
  if (!request) return;
  const status = request.status;
  if (status === RequestStatus.PENDING || status === RequestStatus.ACCEPTED) {
    Requests.update(id, { status: RequestStatus.UNFULFILLED });
    //send notification to user about unfulfilled request
  }
};

export default async (job: Job<Requests>) => await expireRequest(job.data);
