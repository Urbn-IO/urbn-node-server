import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import cookie from "cookie";
import cookieParser from "cookie-parser";
import { COOKIE_NAME } from "../constants";
import connectRedis from "connect-redis";
export const getNextAvailableDate = (day: number) => {
  dayjs.extend(isoWeek);
  const today = dayjs().isoWeekday();
  if (today < day) return dayjs().set("day", day);
  else return dayjs().add(1, "week").set("day", day);
};

export const getUserId = async (cookieString: string, store: connectRedis.RedisStore) => {
  const cookies = cookie.parse(cookieString);
  const sid = cookieParser.signedCookie(cookies[COOKIE_NAME], process.env.SESSION_SECRET);
  return new Promise((resolve, reject) => {
    store.get(sid as string, (_, session) => {
      if (!session) {
        console.error("");
        reject("User not logged In");
      }
      resolve(session?.userId);
    });
  })
    .then((res) => {
      return { userId: res };
    })
    .catch((err) => {
      console.error(err);
    });
};
