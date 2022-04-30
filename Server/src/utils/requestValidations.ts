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

export const ValidateRecipient = async (userId: string, id: number) => {
  const request = await Requests.findOne(id, { select: ["recepient"] });
  if (request?.recepient == userId) {
    return true;
  }
  return false;
};
