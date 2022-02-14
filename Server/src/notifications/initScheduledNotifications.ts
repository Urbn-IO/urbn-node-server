import cron from "node-cron";
import { highPriority } from "./scheduledJobs";
export const initializeScheduledJobs = () => {
  cron.schedule("0 */1 * * * *", highPriority, {
    scheduled: true,
    timezone: "Africa/Lagos",
  });
};
