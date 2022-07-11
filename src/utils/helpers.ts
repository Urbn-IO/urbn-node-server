import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import cookie from "cookie";
import cookieParser from "cookie-parser";
import { COOKIE_NAME } from "../constants";
import connectRedis from "connect-redis";
import { Requests } from "../entities/Requests";
import { NotificationRouteCode, RequestStatus, RequestType } from "../types";
import { sendInstantNotification } from "../services/notifications/handler";
import { CallScheduleBase } from "../entities/CallScheduleBase";
import { getConnection } from "typeorm";
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

export const updateRequestAndNotify = async (paymentRef: string, success: boolean) => {
  let userId, messageTitle, messageBody, route;
  const status = success ? RequestStatus.PENDING : RequestStatus.FAILED;
  try {
    const request = await (
      await Requests.createQueryBuilder()
        .update({ status })
        .where({ paymentRef })
        .returning('requestor, recipient, "requestType"')
        .execute()
    ).raw[0];
    const requestType = request.requestType === RequestType.SHOUTOUT ? "shoutout" : "video call";

    if (success) {
      userId = request.recipient;
      messageTitle = "New Request Alert! 💪🏾";
      messageBody = `You have received a new ${requestType} request`;
      route = NotificationRouteCode.RECEIVED_REQUEST;
    } else {
      userId = request.requestor;
      messageTitle = `Failed ${requestType} Request`;
      messageBody = `Your request to ${request.recipient} failed due to an issue in processing your payment 😔`;
      route = NotificationRouteCode.RESPONSE;
    }

    sendInstantNotification([userId], messageTitle, messageBody, route);
  } catch (err) {
    console.error(err);
  }
};

export const reserveVideoCallScheduleTimeSlot = (slotId: number) => {
  const CallScheduleRepo = getConnection().getTreeRepository(CallScheduleBase);
  CallScheduleRepo.update(slotId, { available: false });
};
