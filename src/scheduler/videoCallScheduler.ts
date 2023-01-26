import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import createhashString from '../utils/createHashString';
import { CallScheduleInput, CallSlotHrs, CallSlotMin, CallSlots } from '../utils/graphqlTypes';
dayjs.extend(utc);

const dateToFormattedString = (date: Date) => {
  return dayjs(date).utc(false).format();
};

const generateMinutes = (startTime: Date, endTime: Date): CallSlotMin[] => {
  const arr: CallSlotMin[] = [];
  for (
    let time = startTime;
    time <= dayjs(endTime).subtract(10, 'minute').toDate();
    time = dayjs(time).add(10, 'minute').toDate()
  ) {
    const begin = time;
    const end = dayjs(time).add(10, 'minute').toDate();

    arr.push({
      id: createhashString([begin.toISOString(), end.toISOString()], 3),
      start: dateToFormattedString(begin),
      end: dateToFormattedString(end),
      available: true,
    });
  }
  return arr;
};

export const generateCallTimeSlots = (input: CallScheduleInput[]) => {
  const g: CallSlots[] = [];
  input.forEach((x) => {
    g.push({
      day: x.day,
      start: dateToFormattedString(x.startTime),
      end: dateToFormattedString(x.endTime),
      hourSlots: (() => {
        /// break time into hourly chunks
        const arr: CallSlotHrs[] = [];
        for (
          let time = x.startTime;
          time <= dayjs(x.endTime).subtract(1, 'hour').toDate();
          time = dayjs(time).add(1, 'hour').toDate()
        ) {
          const begin = time;
          const end = dayjs(time).add(1, 'hour').toDate();
          const minSlots = generateMinutes(begin, end);
          const hrslots: CallSlotHrs = {
            start: dateToFormattedString(begin),
            end: dateToFormattedString(end),
            minSlots: minSlots,
          };

          arr.push(hrslots);
        }
        return arr;
      })(),
    });
  });
  return g;
};
