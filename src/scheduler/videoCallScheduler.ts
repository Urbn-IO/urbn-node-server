import { getConnection } from "typeorm";
import { CallSchedule } from "../entities/CallSchedule";
import { CallScheduleInput } from "../utils/graphqlTypes";
import { toOneHourCallIntervals, toTenMinuteCallIntervals } from "./timeSplit";

const createSchedule = async (
  baseLevelSchedule: CallScheduleInput[],
  firstLevelSchedule: CallScheduleInput[],
  secondLevelSchedule: CallScheduleInput[]
) => {
  const CallScheduleRepo = getConnection().getRepository(CallSchedule);
  const baseScheduleList: CallSchedule[] = [];
  const firstLevelList: CallSchedule[] = [];
  const secondLevelList: CallSchedule[] = [];
  try {
    baseLevelSchedule.forEach((x) => {
      const base = CallScheduleRepo.create({
        celebId: x.celebId,
        day: x.day,
        startTime: x.startTime,
        endTime: x.endTime,
        level: 0,
      });
      baseScheduleList.push(base);
    });
    const baseLevelResult = await CallScheduleRepo.save(baseScheduleList);
    baseLevelResult.forEach((x) => {
      firstLevelSchedule.forEach((y) => {
        if (y.day === x.day) {
          const firstLevel = CallScheduleRepo.create({
            celebId: y.celebId,
            day: y.day,
            startTime: y.startTime,
            endTime: y.endTime,
            level: 1,
            parent: x,
          });
          firstLevelList.push(firstLevel);
        }
      });
    });
    const firstLevelResult = await CallScheduleRepo.save(firstLevelList);
    firstLevelResult.forEach((y) => {
      secondLevelSchedule.forEach((z) => {
        if (z.day === y.day) {
          const secondLevel = CallScheduleRepo.create({
            celebId: z.celebId,
            day: z.day,
            startTime: z.startTime,
            endTime: z.endTime,
            level: 2,
            parent: y,
          });
          secondLevelList.push(secondLevel);
        }
      });
    });
    await CallScheduleRepo.save(secondLevelList);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const scheduleCall = async (celebId: number, inputArray: CallScheduleInput[]) => {
  const baseLevelSchedule: CallScheduleInput[] = inputArray.map((x) => {
    return {
      celebId,
      day: x.day,
      startTime: x.startTime,
      endTime: x.endTime,
    };
  });

  const firstLevelSchedule = toOneHourCallIntervals(baseLevelSchedule);
  const secondLevelSchedule = toTenMinuteCallIntervals(firstLevelSchedule);
  const result = await createSchedule(baseLevelSchedule, firstLevelSchedule, secondLevelSchedule);
  return result;
};
