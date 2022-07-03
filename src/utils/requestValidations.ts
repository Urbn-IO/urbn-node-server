import { Requests } from "../entities/Requests";

export const validateRequestor = async (userId: string, id: number) => {
  const request = await Requests.findOne(id, {
    select: ["requestor", "recepient", "requestType", "requestorName", "callDurationInSeconds"],
  });
  if (request?.requestor === userId && request.requestType !== "shoutout") {
    return request;
  }
  return null;
};

export const validateRecipient = async (userId: string, id: number) => {
  const request = await Requests.findOne(id, {
    select: ["recepient", "recepientAlias", "requestor", "callDurationInSeconds"],
  });
  if (request?.recepient === userId) {
    return request;
  }
  return null;
};
