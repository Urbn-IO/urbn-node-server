import { CallTokens } from "../entities/CallTokens";

export const saveCallToken = async (
  token: string,
  userId: string,
  channelName: string
) => {
  const tokenObj = CallTokens.create({ token, userId, channelName });
  await tokenObj.save();
};

export const deleteCallToken = async (token: string) => {
  await CallTokens.delete({ token });
};
