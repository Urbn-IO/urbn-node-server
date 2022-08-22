import { CallLogs } from "../entities/CallLogs";
import { CallLogInput } from "../types";

export const logCall = async (data: CallLogInput) => {
  try {
    await CallLogs.save({
      requestId: data.requestId,
      participantA: data.participantA,
      participantB: data.participantB,
      callDurationInSeconds: data.callDuration,
      elapsedDurationInSeconds: data.elapsedDuration,
    });
  } catch (err) {
    console.log(err);
  }
};
