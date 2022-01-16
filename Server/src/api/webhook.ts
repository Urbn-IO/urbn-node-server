import crypto from "crypto";
import express from "express";
const router = express.Router();
import { Console } from "console";
import fs from "fs";
import { User } from "../entities/User";
import { CardAuthorization } from "../entities/CardAuthorization";
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
router.post("/", async (req, res) => {
  const requestIp = req.ip;
  if (!WhitelistedIPs.includes(requestIp)) {
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
      const userId = event.metaData.userId;
      const email = event.metaData.email;
      const {
        authorization_code,
        card_type,
        last4,
        exp_month,
        exp_year,
        bin,
        bank,
        channel,
        signature,
        reusable,
        country_code,
        account_name,
      } = event.authorization;
      const user = await User.findOne({ where: { userId } });

      const card = CardAuthorization.create({
        email,
        accountName: account_name,
        authorizationCode: authorization_code,
        cardType: card_type,
        last4,
        expMonth: exp_month,
        expYear: exp_year,
        bin,
        bank,
        channel,
        signature,
        reusable,
        countryCode: country_code,
        user,
      });
      await card.save();
    }
  } catch (err) {
    console.log(err);
    myLogger.error(err);
    res.sendStatus(403);
    return;
  }

  res.sendStatus(200);
});

export default router;
