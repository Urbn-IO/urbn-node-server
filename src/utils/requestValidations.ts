import { Requests } from "../entities/Requests";

export const ValidateCallAndRequestor = async (userId: string, id: number) => {
  const request = await Requests.findOne(id, {
    select: ["requestor", "requestType"],
  });
  if (request?.requestor === userId && request.requestType !== "shoutout") {
    return true;
  }
  return false;
};

export const ValidateShoutoutRecipient = async (userId: string, id: number) => {
  const request = await Requests.findOne(id, {
    select: ["recepient", "recepientAlias", "requestor"],
  });
  if (request?.recepient === userId) {
    return request;
  }
  return null;
};
