import crypto from "crypto";
import express from "express";
import { saveTransaction } from "../../transactions";
import { reserveVideoCallScheduleTimeSlot, updateRequestAndNotify } from "../../../../utils/helpers";
import { saveCardPaystack } from "../../saveCard";
import { SubscriptionTopics } from "../../../../types";
import pubsub from "../../../../pubsub";
const router = express.Router();
const secret = process.env.PAYSTACK_SECRET_KEY;

// Using Express
router.post("/", async (req, res) => {
  const requestIp = req.headers["x-forwarded-for"];
  console.log(requestIp);
  // if (!WhitelistedIPs.includes(requestIp) {
  //   console.error("Invalid Ip");
  //   res.sendStatus(403);
  //   return;
  // }
  // validate events
  try {
    const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(req.body)).digest("hex");
    if (hash == req.headers["x-paystack-signature"]) {
      // Retrieve the request's body
      const payload = req.body;
      const status = payload.event === "charge.success" ? true : false;
      res.sendStatus(200);

      const { data } = payload;

      if (status && data.metadata.newCard) {
        saveCardPaystack(data);
        const userId = data.metadata.userId;
        const ref = data.reference;
        pubsub.publish(SubscriptionTopics.NEW_CARD, { userId, status, ref });
        return;
      }

      updateRequestAndNotify(data.reference, status);
      if (data.metadata.availableSlotId) {
        reserveVideoCallScheduleTimeSlot(data.metadata.availableSlotId);
      }
      saveTransaction(data);
    }
  } catch (err) {
    console.log(err);
    return;
  }
});

export default router;
