import { TWILIO_WEBHOOK } from 'constant';
import express from 'express';
import eventManager from 'services/twilio/call/eventsManager';
import { validateRequest } from 'twilio';
import { VideoCallEvent } from 'utils/graphqlTypes';

const router = express.Router();
const authToken = process.env.TWILIO_AUTH_TOKEN;
const url = TWILIO_WEBHOOK;

router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-twilio-signature'] as string;
    const validRequest = validateRequest(authToken, signature, url, payload);
    const emittableEvents = ['participant-connected', 'participant-disconnected', 'room-ended'];
    if (validRequest) {
      res.sendStatus(200);
      if (emittableEvents.includes(payload.StatusCallbackEvent)) {
        const {
          RoomSid,
          RoomName,
          RoomStatus,
          StatusCallbackEvent,
          ParticipantDuration,
          ParticipantIdentity,
          ParticipantStatus,
        }: VideoCallEvent = payload;

        const manager = eventManager();
        const event = await manager.processCall({
          RoomSid,
          RoomName,
          RoomStatus,
          StatusCallbackEvent,
          ParticipantDuration,
          ParticipantIdentity,
          ParticipantStatus,
        });
        if (!event) return;
        manager.publishVideoCallEvent(event);
      }
      return;
    } else return res.sendStatus(401).send('Unauthorized');
  } catch (err) {
    console.error(err);
    return;
  }
});

export default router;
