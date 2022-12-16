import dayjs from 'dayjs';
import createhashString from '../utils/createHashString';
import { CallScheduleInput, CallSlotHrs, CallSlotMin, CallSlots } from '../utils/graphqlTypes';

// const grandChildren: CallScheduleBase[] = [];
// const children: CallScheduleBase[] = [];

// const saveChild = (day: number, celebId: number) => {
//   const entity = CallScheduleBase.create({
//     celebId,
//     day,
//     children: grandChildren,
//   });
//   children.push(entity);
//   grandChildren.length = 0;
// };

// const createSchedule = async (
//   celebId: number,
//   schedule: { day: DayOfTheWeek; startTime: string; endTime: string; derivedSchedule: CallScheduleInput[] }[]
// ) => {
//   try {
//     const groupedSchedule = _.groupBy(schedule, (obj) => obj.day);
//     const scheduleKeys = Object.keys(groupedSchedule);
//     scheduleKeys.forEach((x) => {
//       const grouped = groupedSchedule[x];
//       for (let y = 0; y < grouped.length; y++) {
//         const entity = CallScheduleBase.create({
//           celebId,
//           startTime: grouped[y].startTime,
//           endTime: grouped[y].endTime,
//           children: grouped[y].derivedSchedule,
//         });
//         grandChildren.push(entity);
//         if (y === grouped.length - 1) saveChild(parseInt(x), celebId);
//       }
//     });

//     const parentEntity = CallScheduleBase.create({
//       celebId,
//       children,
//     });
//     children.length = 0;
//     await CallScheduleBase.save(parentEntity);
//     return true;
//   } catch (err) {
//     console.error(err);
//     return false;
//   }
// };

// export const scheduleCallSlot = async (celebId: number, inputArray: CallScheduleInput[]) => {
//   const schedule = processTimeSchedule(inputArray);
//   const result = await createSchedule(celebId, schedule);
//   return result;
// };

// export const updateCallSlot = async (celebId: number, updateItems: CallScheduleInput[]) => {
//   const callScheduleTreerepo = AppDataSource.getTreeRepository(CallScheduleBase);
//   const parent = await callScheduleTreerepo.findOne({ where: { celebId, parent: false } });
//   if (parent) {
//     await callScheduleTreerepo.remove(parent);
//   }
//   const schedule = processTimeSchedule(updateItems);
//   const result = await createSchedule(celebId, schedule);
//   return result;
// };

const dateToFormattedString = (date: Date) => {
  return dayjs(date).format('HH:mm:ss');
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
      start: dayjs(x.startTime).format('HH:mm:ss'),
      end: dayjs(x.endTime).format('HH:mm:ss'),
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
          console.log('min slots: ', minSlots);
          const hrslots: CallSlotHrs = {
            start: dateToFormattedString(begin),
            end: dateToFormattedString(end),
            minSlots: minSlots,
          };

          arr.push(hrslots);
        }
        console.log('hour slots: ', arr);
        return arr;
      })(),
    });
  });
  return g;
};
