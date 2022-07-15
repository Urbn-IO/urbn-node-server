import { Requests } from "../entities/Requests";

export const validateRequestor = async (userId: string, id: number) => {
  const request = await Requests.findOne(id);
  if (request?.requestor === userId && request.requestType !== "shoutout") {
    return request;
  }
  return null;
};

export const validateRecipient = async (userId: string, id: number) => {
  const request = await Requests.findOne(id);
  if (request?.recipient === userId) {
    return request;
  }
  return null;
};
