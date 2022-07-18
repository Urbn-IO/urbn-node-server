import { getConnection, In } from "typeorm";
import { NotificationToken } from "../../entities/NotificationToken";

export const addToken = async (
  userId: string,
  deviceId: string,
  platform: string,
  notificationToken: string,
  pushKitToken?: string
): Promise<string> => {
  const tokens = NotificationToken.create({
    userId,
    deviceId,
    devicePlatform: platform,
    notificationToken,
    pushKitToken,
  });
  try {
    await tokens.save();
  } catch (err) {
    if (err.code === "23505") {
      await NotificationToken.update({ deviceId }, tokens);
      console.log("Token Updated");
    }
    return "An Error occured while storing token";
  }

  return "sucessfully added token";
};

export const getTokens = async (userId: string[]): Promise<string[]> => {
  const tokenObj = await NotificationToken.find({
    where: { userId: In(userId) },
    select: ["notificationToken"],
  });
  if (tokenObj) {
    const tokens = tokenObj.map((x) => x.notificationToken);
    return tokens;
  }
  return [];
};

export const getServiceCallTokens = async (userId: string[]) => {
  const tokenObj = await NotificationToken.find({
    where: { userId: In(userId) },
    select: ["notificationToken", "pushKitToken", "devicePlatform"],
  });
  if (tokenObj) {
    const tokens: string[] = [];
    const pushKitTokens: string[] = [];
    tokenObj.forEach(async (x) => {
      if (x.devicePlatform === "ios") {
        pushKitTokens.push(x.pushKitToken as string);
      } else {
        tokens.push(x.notificationToken);
      }
    });
    return { tokens, pushKitTokens };
  }
  return {};
};

export const deleteTokens = async (userId?: string, tokens?: string[]) => {
  const queryBuilder = getConnection().createQueryBuilder().delete().from(NotificationToken);

  if (userId) {
    queryBuilder.where("userId = :userId", { userId });
  } else if (tokens) {
    queryBuilder.where("notificationToken In (:...tokens)", { tokens });
  } else {
    throw new Error("User token to be deleted not supplied");
  }

  try {
    queryBuilder.execute();
  } catch (err) {
    throw new Error("An error occured while attempting to delete tokens");
  }
};
