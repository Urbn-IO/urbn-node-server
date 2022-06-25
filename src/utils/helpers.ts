import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
export const getNextAvailableDate = (day: number) => {
  dayjs.extend(isoWeek);
  const today = dayjs().isoWeekday();
  if (today < day) return dayjs().set("day", day);
  else return dayjs().add(1, "week").set("day", day);
};
