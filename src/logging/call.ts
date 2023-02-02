import { CallLogs } from '../entities/CallLogs';
import { CallLogInput } from '../types';

export const logCallSession = async (data: CallLogInput) => {
  try {
    await CallLogs.save({
      requestId: data.requestId,
      participantA: data.participantA,
      participantB: data.participantB,
      callDurationInSeconds: data.callDuration,
      elapsedDurationInSeconds: data.elapsedDuration,
    });
  } catch (err) {
    console.error(err);
  }
};
