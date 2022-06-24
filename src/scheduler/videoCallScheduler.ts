import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import _ from "lodash";
import { CallScheduleBase } from "../entities/CallScheduleBase";
import { DayOfTheWeek } from "../types";
import { CallScheduleInput } from "../utils/graphqlTypes";
import { processTimeSchedule } from "./timeSplit";

dayjs.extend(isBetween);

const grandChildren: CallScheduleBase[] = [];
const children: CallScheduleBase[] = [];

const saveChild = (day: number, celebId: number) => {
  const entity = CallScheduleBase.create({
    celebId,
    day,
    children: grandChildren,
  });
  children.push(entity);
  grandChildren.length = 0;
};

const createSchedule = async (
  celebId: number,
  schedule: { day: DayOfTheWeek; startTime: string; endTime: string; derivedSchedule: CallScheduleInput[] }[]
) => {
  try {
    const groupedSchedule = _.groupBy(schedule, (obj) => obj.day);
    const scheduleKeys = Object.keys(groupedSchedule);
    scheduleKeys.forEach((x) => {
      const grouped = groupedSchedule[x];
      for (let y = 0; y < grouped.length; y++) {
        const entity = CallScheduleBase.create({
          celebId,
          startTime: grouped[y].startTime,
          endTime: grouped[y].endTime,
          children: grouped[y].derivedSchedule,
        });
        grandChildren.push(entity);
        if (y === grouped.length - 1) saveChild(parseInt(x), celebId);
      }
    });

    const parentEntity = CallScheduleBase.create({
      celebId,
      children,
    });
    children.length = 0;
    await CallScheduleBase.save(parentEntity);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const scheduleCallSlot = async (celebId: number, inputArray: CallScheduleInput[]) => {
  const schedule = processTimeSchedule(inputArray);
  const result = await createSchedule(celebId, schedule);
  return result;
};

// export const updateSchedule = async (celebId: number, updateItems: CallScheduleInput[]) => {
//   const baseLevelSchedule: CallScheduleInput[] = updateItems.map((x) => {
//     return {
//       celebId,
//       day: x.day,
//       startTime: x.startTime,
//       endTime: x.endTime,
//     };
//   });
//   const result = await scheduleCall(celebId, updateItems);
//   return result;
//   // const CallScheduleRepo = getConnection().getRepository(CallSchedule);
// };
//
