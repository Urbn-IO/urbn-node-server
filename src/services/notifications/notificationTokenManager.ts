import { In } from 'typeorm';
import AppDataSource from '../../config/ormconfig';
import { NotificationToken } from '../../entities/NotificationToken';
import { PlatformOptions } from '../../types';

export const addToken = async (
  userId: string,
  deviceId: string,
  platform: PlatformOptions,
  notificationToken: string,
  pushkitToken?: string
): Promise<string> => {
  const token = NotificationToken.create({
    userId,
    deviceId,
    devicePlatform: platform,
    notificationToken,
    pushkitToken: pushkitToken,
  });
  try {
    await token.save();
  } catch (err) {
    if (err.code === '23505') {
      await NotificationToken.update({ userId }, token);
    }
    return 'An Error occured while storing token';
  }

  return 'sucessfully added token';
};

export const getTokens = async (userId: string[]): Promise<string[]> => {
  try {
    const tokenObj = await NotificationToken.find({
      where: { userId: In(userId) },
      select: ['notificationToken'],
    });
    if (tokenObj) {
      const tokens = tokenObj.map((x) => x.notificationToken);
      return tokens;
    }
    throw new Error("Couldn't find list of notifications tokens");
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const getServiceCallTokens = async (userId: string[]) => {
  const tokenObj = await NotificationToken.find({
    where: { userId: In(userId) },
    select: ['notificationToken', 'pushkitToken', 'devicePlatform'],
  });
  if (tokenObj) {
    const tokens: string[] = [];
    const pushkitTokens: string[] = [];
    tokenObj.forEach(async (x) => {
      if (x.devicePlatform === PlatformOptions.IOS) {
        pushkitTokens.push(x.pushkitToken as string);
      } else {
        tokens.push(x.notificationToken);
      }
    });
    return { tokens, pushkitTokens };
  }
  return {};
};

export const deleteTokens = async (userId?: string, tokens?: string[]) => {
  const queryBuilder = AppDataSource.createQueryBuilder().delete().from(NotificationToken);

  if (userId) {
    queryBuilder.where('userId = :userId', { userId });
  } else if (tokens) {
    queryBuilder.where('notificationToken In (:...tokens)', { tokens });
  } else {
    throw new Error('User token to be deleted not supplied');
  }

  try {
    queryBuilder.execute();
  } catch (err) {
    throw new Error('An error occured while attempting to delete tokens');
  }
};
