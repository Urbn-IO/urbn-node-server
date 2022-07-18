import crypto from "crypto";
import express from "express";
import { Console } from "console";
import fs from "fs";
import { saveTransaction } from "../../transactions";
import { reserveVideoCallScheduleTimeSlot, updateRequestAndNotify } from "../../../../utils/helpers";
const router = express.Router();
const secret = process.env.PAYSTACK_SECRET_KEY;
// const WhitelistedIPs = ["52.31.139.75", "52.49.173.169", "52.214.14.220", "::1"];

//tempororary response logger
const myLogger = new Console({
  stdout: fs.createWriteStream("normalStdout.txt"),
  stderr: fs.createWriteStream("errStdErr.txt"),
});

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

      updateRequestAndNotify(payload.data.reference, status);
      if (payload.data.metadata.availableSlotId) {
        reserveVideoCallScheduleTimeSlot(payload.data.metadata.availableSlotId);
      }
      saveTransaction(payload.data);

      myLogger.log(payload);
    }
  } catch (err) {
    console.log(err);
    myLogger.error(err);
    return;
  }
});

export default router;
