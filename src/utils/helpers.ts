import connectRedis from 'connect-redis';
import { SESSION_COOKIE_NAME } from 'constant';
import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Celebrity } from 'entities/Celebrity';
import { Request, Response } from 'express';
import { sendInstantNotification } from 'services/notifications/handler';
import { ClassType, InputType, ObjectType } from 'type-graphql';
import { DayOfTheWeek, NotificationRouteCode } from 'types';

//Rip funcs from here into more suitable places in future

export const getNextAvailableDate = (day: number) => {
  dayjs.extend(isoWeek);
  const today = dayjs().isoWeekday();
  if (today < day) return dayjs().set('day', day);
  else return dayjs().add(1, 'week').set('day', day);
};

export const getSessionContext = async (cookieString: string, store: connectRedis.RedisStore) => {
  const cookies = cookie.parse(cookieString);
  const sid = cookieParser.signedCookie(cookies[SESSION_COOKIE_NAME], process.env.SESSION_SECRET);
  if (!sid) return null;
  return new Promise((resolve) => {
    store.get(sid as string, (_, session) => {
      resolve(session?.userId);
    });
  })
    .then((res) => {
      return { userId: res, sessionId: sid };
    })
    .catch((err) => {
      console.error(err);
    });
};

export const reserveVideoCallScheduleTimeSlot = async (celebrity: string, slotId: string, day: DayOfTheWeek) => {
  const celeb = await Celebrity.findOne({
    where: { userId: celebrity },
    select: ['availableTimeSlots'],
  });
  if (!celeb) return;
  const availableTimeSlots = celeb.availableTimeSlots;
  for (const x of availableTimeSlots) {
    if (x.day === day) {
      for (const y of x.hourSlots) {
        for (const z of y.minSlots) {
          if (z.id === slotId) {
            z.available = false;
            return;
          }
        }
      }
    }
  }

  await Celebrity.update({ userId: celebrity }, { availableTimeSlots });
};

export const callDuration = (callLength: number, startTime: Date, currentTime: Date) => {
  const normalisedDuration = (currentTime.getTime() - startTime.getTime()) / 1000;
  const countDown = callLength - normalisedDuration;
  const countDownDuration = countDown > 0 ? countDown : 0;
  return countDownDuration;
};

// export const attachInstantShoutoutPrice = (celeb: Celebrity[]) => {
//   celeb.forEach((x) => {
//     if (x.acceptsInstantShoutout === true) x.instantShoutout = x.shoutout * INSTANT_SHOUTOUT_RATE;
//   });
//   return celeb;
// };

//send push notifications for users with bounced or complaint emails warning them they cant receieve emails
export const badEmailNotifier = (userIds: string[]) => {
  sendInstantNotification(
    userIds,
    'Problems Sending you emails ⛔️',
    `We are unable to send you emails! Update your email address on the app with a valid email and remove emails from us from your spam`,
    NotificationRouteCode.DEFAULT
  );
};

export const replacer = (_: any, value: any) => {
  if (value instanceof Map) {
    return {
      dataType: 'Map',
      value: [...value],
    };
  } else {
    return value;
  }
};

export const reviver = (_: any, value: any) => {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
};

export const destroySession = (req: Request, res: Response): Promise<boolean> => {
  return new Promise((resolve, reject) =>
    req.session.destroy((err: unknown) => {
      res.clearCookie(SESSION_COOKIE_NAME);
      if (err) {
        console.error(err);
        reject(false);
        return;
      }

      resolve(true);
    })
  );
};

export function PartialType<TClassType extends ClassType>(BaseClass: TClassType) {
  const metadata = (global as any).TypeGraphQLMetadataStorage;

  @ObjectType({ isAbstract: true })
  @InputType({ isAbstract: true })
  class PartialClass extends BaseClass {}

  // Copy relevant fields and create a nullable version on the new type
  const fields = metadata.fields.filter(
    (f: { target: TClassType }) => f.target === BaseClass || BaseClass.prototype instanceof f.target
  );
  fields.forEach((field: { typeOptions: any }) => {
    const newField = {
      ...field,
      typeOptions: { ...field.typeOptions, nullable: true },
      target: PartialClass,
    };
    metadata.fields.push(newField);
  });

  return PartialClass;
}
