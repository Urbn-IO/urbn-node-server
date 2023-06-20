import { APP_BASE_URL } from 'constant';
import express from 'express';
import sendMail from 'services/aws/email/manager';
import { createDynamicLink } from 'services/deep_links/dynamicLinks';
import { sendInstantNotification } from 'services/notifications/handler';
import { EmailSubject, NotificationRouteCode } from 'types';
const router = express.Router();

router.post('/verified', async (req, res) => {
  try {
    const payload = req.body;
    const celebs: {
      userId: string;
      alias: string;
      email: string;
    }[] = payload.data;

    res.sendStatus(200);

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
    return;
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

router.post('/registered', async (req, res) => {
  try {
    const payload = req.body;
    const data: {
      emailAddress: string;
      celebAlias: string;
      password: string;
    } = payload.data;

    res.sendStatus(200);

    const link = `${APP_BASE_URL}/celebrity-new?email=${data.emailAddress}&password=${data.password}`;
    const url = await createDynamicLink(link);
    sendMail({
      emailAddresses: [data.emailAddress],
      subject: EmailSubject.CELEBRITY_REGISTRATION,
      celebAlias: data.celebAlias,
      url,
    });
    return;
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

export default router;
