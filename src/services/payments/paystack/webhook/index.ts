import crypto from "crypto";
import express from "express";
import { saveTransaction } from "../../transactions";
import { reserveVideoCallScheduleTimeSlot, updateRequestAndNotify } from "../../../../utils/helpers";
import { saveCardPaystack } from "../../saveCard";
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

      if (status && payload.data.metadata.newCard) {
        const { data } = payload;
        saveCardPaystack(data);
        return;
      }

      updateRequestAndNotify(payload.data.reference, status);
      if (payload.data.metadata.availableSlotId) {
        reserveVideoCallScheduleTimeSlot(payload.data.metadata.availableSlotId);
      }
      saveTransaction(payload.data);
    }
  } catch (err) {
    console.log(err);
    return;
  }
});

export default router;
