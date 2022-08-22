import crypto from "crypto";
import express from "express";
import { saveTransaction } from "../../transactions";
import { reserveVideoCallScheduleTimeSlot } from "../../../../utils/helpers";
import { saveCardPaystack } from "../../saveCard";
import { SubscriptionTopics } from "../../../../types";
import publish from "../../../../utils/publish";
import { NewCardVerificationResponse } from "../../../../utils/graphqlTypes";
import { updateRequestAndNotify } from "../../../../request/manage";
const router = express.Router();
const secret = process.env.PAYSTACK_SECRET_KEY;

router.post("/", async (req, res) => {
  try {
    const payload = req.body;
    const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(payload)).digest("hex");
    if (hash == req.headers["x-paystack-signature"]) {
      res.sendStatus(200);
      const status = payload.event === "charge.success" ? true : false;

      const { data } = payload;

      if (data.metadata.newCard) {
        saveCardPaystack(data);
        const userId = data.metadata.userId;
        const ref = data.reference;
        publish<NewCardVerificationResponse>(SubscriptionTopics.NEW_CARD, { userId, status, ref });
        return;
      }
      updateRequestAndNotify(data.reference, status);
      if (data.metadata.availableSlotId) {
        reserveVideoCallScheduleTimeSlot(data.metadata.availableSlotId);
      }
      saveTransaction(data);
      return;
    } else return res.sendStatus(401).send("Unauthorized");
  } catch (err) {
    console.log(err);
    return;
  }
});

export default router;
