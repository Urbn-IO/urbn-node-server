import { Requests } from '../entities/Requests';

export const validateRequestor = async (userId: string, id: number) => {
  const request = await Requests.findOne({ where: { id } });
  if (request?.customer === userId && request.requestType !== 'shoutout') {
    return request;
  }
  return null;
};

export const validateRecipient = async (userId: string, id: number) => {
  const request = await Requests.findOne({ where: { id } });
  if (request?.celebrity === userId) {
    return request;
  }
  return null;
};
