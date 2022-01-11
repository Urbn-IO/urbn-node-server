import crypto from "crypto";
import express from "express";
const router = express.Router();
import { Console } from "console";
import fs from "fs";
const secret = process.env.PAYSTACK_SECRET_KEY;
const WhitelistedIPs = [
  "52.31.139.75",
  "52.49.173.169",
  "52.214.14.220",
  "::1",
];

//tempororary response logger
const myLogger = new Console({
  stdout: fs.createWriteStream("normalStdout.txt"),
  stderr: fs.createWriteStream("errStdErr.txt"),
});

// Using Express
router.post("/", function (req, res) {
  const requestIP = req.ip;
  console.log(requestIP);
  if (!WhitelistedIPs.includes(requestIP)) {
    res.sendStatus(403);
    return;
  }
  // validate events
  try {
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (hash == req.headers["x-paystack-signature"]) {
      // Retrieve the request's body
      const event = req.body;
      console.log("paystack event result: ", event);
      myLogger.log(event);
      // Do something with event
    }
  } catch (err) {
    myLogger.error(err);
    res.sendStatus(403);
    return;
  }

  res.sendStatus(200);
});

export default router;
