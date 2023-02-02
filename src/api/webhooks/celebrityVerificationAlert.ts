import express from 'express';
import { APP_BASE_URL } from '../../constants';
import sendMail from '../../services/aws/email/manager';
import { createDynamicLink } from '../../services/deep_links/dynamicLinks';
import { sendInstantNotification } from '../../services/notifications/handler';
import { EmailSubject, NotificationRouteCode } from '../../types';
const router = express.Router();

router.post('/', async (req, res) => {
  const payload = req.body;
  const celebs: {
    userId: string;
    alias: string;
    email: string;
  }[] = payload.data;

  res.sendStatus(200);

  console.log('webhook hit, sending notifications to new celebs ');

  const userIds = celebs.map((x) => x.userId);

  sendInstantNotification(
    userIds,
    "You've been verified! ✅",
    `Thank you for joining us, we look forward to working with you. All that's left is to complete your profile and start receiving requests from your fans, open the app to get started!`,
    NotificationRouteCode.DEFAULT
  );
  const link = APP_BASE_URL;
  const url = await createDynamicLink(link);

  if (!url) return;

  celebs.forEach((x) => {
    sendMail({ emailAddresses: [x.email], subject: EmailSubject.CELEBRITY_VERIFIED, celebAlias: x.alias, url });
  });
});

export default router;
