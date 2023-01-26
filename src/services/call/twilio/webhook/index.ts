import express from 'express';
import { validateRequest } from 'twilio';
import { TWILIO_WEBHOOK } from '../../../../constants';
import { VideoCallEvent } from '../../../../utils/graphqlTypes';
import eventManager from '../eventsManager';

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
      console.log('Packet receieved from twilio!');
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
    console.log(err);
    return;
  }
});

export default router;
