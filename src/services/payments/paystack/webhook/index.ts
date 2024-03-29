import crypto from 'crypto';
import { Requests } from 'entities/Requests';
import express from 'express';
import { updateRequestAndNotify } from 'request/manage';
import { saveTransaction } from 'services/payments/transactions';
import { reserveVideoCallScheduleTimeSlot } from 'utils/helpers';
const router = express.Router();
const secret = process.env.PAYSTACK_SECRET_KEY;

router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');

    if (hash != req.headers['x-paystack-signature']) {
      res.sendStatus(401).send('Unauthorized');
      return;
    }

    res.sendStatus(200);
    const status = payload.event === 'charge.success' ? true : false;

    const { data } = payload;
    const metadata = data.metadata;

    const request: Partial<Requests> = metadata;
    await updateRequestAndNotify(request, status);

    if (metadata.celebrity && metadata.callSlotId && metadata.availableDay) {
      reserveVideoCallScheduleTimeSlot(metadata.celebrity, metadata.callSlotId, metadata.availableDay);
    }
    await saveTransaction(data);
  } catch (err) {
    console.error(err);
    return;
  }
});

export default router;
