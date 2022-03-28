import { CallTokens } from "../entities/CallTokens";

export const saveCallToken = async (
  token: string,
  requestId: number,
  roomName: string
) => {
  const tokenObj = CallTokens.create({ token, requestId, roomName });
  await tokenObj.save();
};

export const deleteCallToken = async (token: string) => {
  await CallTokens.delete({ token });
};
