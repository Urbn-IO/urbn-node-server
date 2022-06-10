import { getConnection, In } from "typeorm";
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

export const getFcmTokens = async (userId: string[]): Promise<string[]> => {
  const tokenObj = await FcmTokens.find({
    where: { userId: In(userId) },
    select: ["token"],
  });
  if (tokenObj) {
    const tokens = tokenObj.map((x) => x.token);
    return tokens;
  }
  return [];
};

export const deleteFcmTokens = async (userId?: string, tokens?: string[]) => {
  const queryBuilder = getConnection()
    .createQueryBuilder()
    .delete()
    .from(FcmTokens);

  if (userId) {
    queryBuilder.where("userId = :userId", { userId });
  } else if (tokens) {
    queryBuilder.where("token In (:...tokens)", { tokens });
  } else {
    throw new Error("User token to be deleted not supplied");
  }

  try {
    queryBuilder.execute();
  } catch (err) {
    throw new Error("An error occured while attempting to delete tokens");
  }
};
