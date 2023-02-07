import connectRedis from 'connect-redis';
import cookie from 'cookie';
import cookieParser from 'cookie-parser';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { SESSION_COOKIE_NAME } from 'constant';
import { Celebrity } from 'entities/Celebrity';
import { sendInstantNotification } from 'services/notifications/handler';
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
