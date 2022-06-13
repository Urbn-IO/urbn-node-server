import dayjs from "dayjs";
import { CallScheduleInput } from "../utils/graphqlTypes";

export const toOneHourCallIntervals = (daySchedule: CallScheduleInput[]) => {
  const timeRange: CallScheduleInput[] = [];
  daySchedule.forEach((x) => {
    for (
      let time = x.startTime;
      time <= dayjs(x.endTime).subtract(1, "hour").toDate();
      time = dayjs(time).add(1, "hour").toDate()
    ) {
      const begin = time,
        end = dayjs(time).add(1, "hour").toDate();
      const objCopy = { ...x };
      objCopy.startTime = begin;
      objCopy.endTime = end;
      timeRange.push(objCopy);
    }
  });
  return timeRange;
};

export const toTenMinuteCallIntervals = (hourSchedule: CallScheduleInput[]) => {
  const timeRange: CallScheduleInput[] = [];
  hourSchedule.forEach((x) => {
    for (
      let time = x.startTime;
      time <= dayjs(x.endTime).subtract(10, "minute").toDate();
      time = dayjs(time).add(10, "minute").toDate()
    ) {
      const begin = time,
        end = dayjs(time).add(10, "minute").toDate();
      const objCopy = { ...x };
      objCopy.startTime = begin;
      objCopy.endTime = end;
      timeRange.push(objCopy);
    }
  });
  return timeRange;
};
