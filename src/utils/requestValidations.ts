import { Requests } from "../entities/Requests";

export const validateRequestor = async (userId: string, id: number) => {
  const request = await Requests.findOne(id, {
    select: ["requestor", "recipient", "requestType", "requestorName", "callDurationInSeconds"],
  });
  if (request?.requestor === userId && request.requestType !== "shoutout") {
    return request;
  }
  return null;
};

export const validateRecipient = async (userId: string, id: number) => {
  const request = await Requests.findOne(id, {
    select: ["recipient", "recipientAlias", "requestor", "callDurationInSeconds"],
  });
  if (request?.recipient === userId) {
    return request;
  }
  return null;
};
