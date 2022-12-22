import crypto from 'crypto';
import express from 'express';
import { updateRequestAndNotify } from '../../../../request/manage';
import { SubscriptionTopics, TransactionsMetadata } from '../../../../types';
import { VerifyCardResponse } from '../../../../utils/graphqlTypes';
import { reserveVideoCallScheduleTimeSlot } from '../../../../utils/helpers';
import publish from '../../../../utils/publish';
import { saveCardPaystack } from '../../saveCard';
import { saveTransaction } from '../../transactions';
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
    const metadata = data.metadata as TransactionsMetadata;
    const userId = metadata.userId;
    const celebrity = metadata.celebrity;
    const availableSlotId = metadata.availableSlotId;
    const day = metadata.availableDay;

    if (String(metadata.newCard) === 'true') {
      await saveCardPaystack(data);
      publish<VerifyCardResponse>(SubscriptionTopics.NEW_CARD, {
        userId,
        status,
      });
      return;
    }

    updateRequestAndNotify(metadata, status);

    if (celebrity && availableSlotId && day) {
      reserveVideoCallScheduleTimeSlot(celebrity, availableSlotId, day);
    }
    await saveTransaction(data);
  } catch (err) {
    console.log(err);
    return;
  }
});

export default router;
