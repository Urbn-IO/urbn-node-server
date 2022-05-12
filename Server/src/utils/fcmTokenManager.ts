import { getConnection } from "typeorm";
import { FcmTokens } from "../entities/FcmTokens";

export const addFcmToken = async (
  userId: string,
  deviceId: string,
  fcmToken: string
): Promise<string> => {
  try {
    const fcmTokens = FcmTokens.create({ userId, deviceId, token: fcmToken });
    await fcmTokens.save();
  } catch (err) {
    if (err.code === "23505") {
      return "Error! Token already exists on the database";
    }
    return "An Error occured while storing token";
  }

  return "sucessfully added token";
};

export const getFcmTokens = async (userId: string): Promise<string[]> => {
  const tokenObj = await FcmTokens.find({ where: userId, select: ["token"] });
  if (tokenObj) {
    const tokens: string[] = [];
    tokenObj.forEach((x) => {
      tokens.push(x.token);
    });
    return tokens;
  }
  return [];
};

export const deleteFcmTokens = async (userId: string, deviceId: string) => {
  await getConnection()
    .createQueryBuilder()
    .delete()
    .from(FcmTokens)
    .where("userId = :userId", { userId })
    .andWhere("deviceId = :deviceId", { deviceId })
    .execute();
};
