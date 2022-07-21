import express from "express";
import { validateRequest } from "twilio";

const router = express.Router();
const authToken = process.env.TWILIO_AUTH_TOKEN;
const url = process.env.TWILIO_WEBHOOK;

router.post("/", async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers["x-twilio-signature"] as string;
    const validRequest = validateRequest(authToken, signature, url, payload);
    if (validRequest) {
      res.sendStatus(200);
      console.log(payload);
      return;
    } else return res.sendStatus(401).send("Unauthorized");
  } catch (err) {
    console.log(err);
    return;
  }
});

export default router;
