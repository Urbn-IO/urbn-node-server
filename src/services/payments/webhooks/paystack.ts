import crypto from "crypto";
import express from "express";
import { Console } from "console";
import fs from "fs";
const router = express.Router();
const secret = process.env.PAYSTACK_SECRET_KEY;
const WhitelistedIPs = ["52.31.139.75", "52.49.173.169", "52.214.14.220", "::1"];

//tempororary response logger
const myLogger = new Console({
  stdout: fs.createWriteStream("normalStdout.txt"),
  stderr: fs.createWriteStream("errStdErr.txt"),
});

// Using Express
router.post("/", async (req, res) => {
  const requestIp = req.ip;
  if (!WhitelistedIPs.includes(requestIp)) {
    console.error("Invalid Ip");
    res.sendStatus(403);
    return;
  }
  // validate events
  try {
    const hash = crypto.createHmac("sha512", secret).update(JSON.stringify(req.body)).digest("hex");
    if (hash == req.headers["x-paystack-signature"]) {
      // Retrieve the request's body
      const event = req.body;
      console.log("paystack event result: ", event);
      myLogger.log(event);
      res.sendStatus(200);
    }
  } catch (err) {
    console.log(err);
    myLogger.error(err);
    res.sendStatus(403);
    return;
  }
});

export default router;
