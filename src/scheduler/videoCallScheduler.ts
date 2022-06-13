import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { getConnection } from "typeorm";
import { CallSchedule } from "../entities/CallSchedule";
import { CallScheduleInput } from "../utils/graphqlTypes";
import { toOneHourCallIntervals, toTenMinuteCallIntervals } from "./timeSplit";

dayjs.extend(isBetween);

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
        startTime: dayjs(x.startTime).format("HH:mm:ss"),
        endTime: dayjs(x.endTime).format("HH:mm:ss"),
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
            startTime: dayjs(y.startTime).format("HH:mm:ss"),
            endTime: dayjs(y.endTime).format("HH:mm:ss"),
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
        const dateString = dayjs().format("YYYY-MM-DD") + " ";
        const formattedStartTime = dayjs(z.startTime).format("HH:mm:ss");
        const parentStartTime = dayjs(dateString + y.startTime);
        const parentEndTime = dayjs(dateString + y.endTime);
        const startTimeWithDate = dayjs(dateString + formattedStartTime);
        if (z.day === y.day && dayjs(startTimeWithDate).isBetween(parentStartTime, parentEndTime, null, "[)")) {
          const secondLevel = CallScheduleRepo.create({
            celebId: z.celebId,
            day: z.day,
            startTime: formattedStartTime,
            endTime: dayjs(z.endTime).format("HH:mm:ss"),
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
