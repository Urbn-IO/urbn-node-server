import { CallTokens } from "../entities/CallTokens";

export const saveCallToken = async (
  token: string,
  userId: string,
  roomName: string
) => {
  const tokenObj = CallTokens.create({ token, userId, roomName });
  await tokenObj.save();
};

export const deleteCallToken = async (token: string) => {
  await CallTokens.delete({ token });
};
