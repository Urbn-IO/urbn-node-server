import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import cookie from "cookie";
import cookieParser from "cookie-parser";
import { INSTANT_SHOUTOUT_RATE, SESSION_COOKIE_NAME } from "../constants";
import connectRedis from "connect-redis";
import { Celebrity } from "../entities/Celebrity";
import { DayOfTheWeek } from "../types";

export const getNextAvailableDate = (day: number) => {
  dayjs.extend(isoWeek);
  const today = dayjs().isoWeekday();
  if (today < day) return dayjs().set("day", day);
  else return dayjs().add(1, "week").set("day", day);
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
    select: ["availableTimeSlots"],
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

export const attachInstantShoutoutPrice = (celeb: Celebrity[]) => {
  celeb.forEach((x) => {
    if (x.acceptsInstantShoutout === true) x.instantShoutout = x.shoutout * INSTANT_SHOUTOUT_RATE;
  });
  return celeb;
};
