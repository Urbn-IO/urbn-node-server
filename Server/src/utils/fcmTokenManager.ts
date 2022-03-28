import { FcmTokens } from "../entities/FcmTokens";

export const addFcmToken = async (
  userId: string,
  fcmToken: string
): Promise<string> => {
  try {
    const fcmTokens = FcmTokens.create({ userId, token: fcmToken });
    await fcmTokens.save();
  } catch (err) {
    if (err.code === "23505") {
      return "Error! Token already exists on the database";
    }
    return "An Error occured while storing token";
  }

  return "sucessfully added token";
};

export const getFcmTokens = async (userId: string): Promise<FcmTokens[]> => {
  const tokens = await FcmTokens.find({ where: userId });
  if (tokens) {
    return tokens;
  }
  return [];
};
