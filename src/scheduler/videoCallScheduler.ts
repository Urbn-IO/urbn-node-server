import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import _ from "lodash";
import { AppDataSource } from "../db";
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

export const updateCallSlot = async (celebId: number, updateItems: CallScheduleInput[]) => {
  const callScheduleTreerepo = AppDataSource.getTreeRepository(CallScheduleBase);
  const parent = await callScheduleTreerepo.findOne({ where: { celebId, parent: false } });
  if (parent) {
    await callScheduleTreerepo.remove(parent);
  }
  const schedule = processTimeSchedule(updateItems);
  const result = await createSchedule(celebId, schedule);
  return result;
};
