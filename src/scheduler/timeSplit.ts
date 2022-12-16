import dayjs from 'dayjs';
import { DayOfTheWeek } from '../types';
import { CallScheduleInput } from '../utils/graphqlTypes';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);

export const processTimeSchedule = (daySchedule: CallScheduleInput[]) => {
  const timeRange = toOneHourCallIntervals(daySchedule);
  const result = toTenMinuteCallIntervals(timeRange);
  return result;
};

const toOneHourCallIntervals = (daySchedule: CallScheduleInput[]) => {
  const timeRange: CallScheduleInput[] = [];
  daySchedule.forEach((x) => {
    for (
      let time = x.startTime;
      time <= dayjs(x.endTime).subtract(1, 'hour').toDate();
      time = dayjs(time).add(1, 'hour').toDate()
    ) {
      const begin = time,
        end = dayjs(time).add(1, 'hour').toDate();
      const objCopy = { ...x };
      objCopy.startTime = begin;
      objCopy.endTime = end;
      timeRange.push(objCopy);
    }
  });
  return timeRange;
};

const toTenMinuteCallIntervals = (hourSchedule: CallScheduleInput[]) => {
  const timeRange: CallScheduleInput[] = [];
  const timeRangeGroup: {
    day: DayOfTheWeek;
    startTime: string;
    endTime: string;
    derivedSchedule: CallScheduleInput[];
  }[] = [];
  hourSchedule.forEach((x) => {
    for (
      let time = x.startTime;
      time <= dayjs(x.endTime).subtract(10, 'minute').toDate();
      time = dayjs(time).add(10, 'minute').toDate()
    ) {
      const begin = time,
        end = dayjs(time).add(10, 'minute').toDate();
      const objCopy = { ...x } as any;
      objCopy.startTime = dayjs(begin).format('HH:mm:ss');
      objCopy.endTime = dayjs(end).format('HH:mm:ss');
      objCopy.celebId = 1;
      objCopy.available = true;
      timeRange.push(objCopy);
    }

    timeRangeGroup.push({
      day: x.day,
      startTime: dayjs(x.startTime).format('HH:mm:ss'),
      endTime: dayjs(x.endTime).format('HH:mm:ss'),
      derivedSchedule: timeRange.filter((y) => {
        const dateString = dayjs(x.startTime).format('YYYY-MM-DD') + ' ';
        const startTimeWithDate = dayjs(dateString + y.startTime);
        if (y.day === x.day && dayjs(startTimeWithDate).isBetween(x.startTime, x.endTime, null, '[)')) {
          return true;
        }
        return false;
      }),
    });
  });
  return timeRangeGroup;
};
