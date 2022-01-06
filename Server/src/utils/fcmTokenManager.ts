import { FcmTokens } from "../entities/fcmTokens";

export const addFcmToken = async (
  userId: string,
  fcmToken: string
): Promise<string> => {
  try {
    const fcmTokens = FcmTokens.create({ userId, token: fcmToken });
    await fcmTokens.save();
  } catch (err) {
    return "An Error occured while storing token";
  }

  return "sucessfully added token";
};

export const getFcmTokens = async (
  userId: string
): Promise<string | FcmTokens[]> => {
  const tokens = FcmTokens.find({ where: userId });
  if (tokens) {
    return tokens;
  }
  return `no tokens found for user: ${userId} `;
};
