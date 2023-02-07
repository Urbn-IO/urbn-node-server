import {
  ConfirmSubscriptionCommand,
  ConfirmSubscriptionCommandInput,
  SubscribeCommand,
  SubscribeCommandInput,
} from '@aws-sdk/client-sns';
import express, { Request } from 'express';
import { In } from 'typeorm';
import { __prod__ } from 'constant';
import { User } from 'entities/User';
import client from 'services/aws/clients/sns';

const router = express.Router();

const topicArnBounce = 'arn:aws:sns:eu-west-2:234408821758:ses-bounces-topic-prod';
const topicArnComplaint = 'arn:aws:sns:eu-west-2:234408821758:ses-complaints-topic-prod';
const bounceEndpoint = __prod__
  ? 'https://api.geturbn.io/sns/email-bounces'
  : 'https://api.geturbn.io/sns/email-bounces';
const complaintEndpoint = __prod__
  ? 'https://api.geturbn.io/sns/email-complaints'
  : 'https://api.geturbn.io/sns/email-complaints';

const bounceSubscriptionInput: SubscribeCommandInput = {
  Protocol: 'https',
  TopicArn: topicArnBounce,
  Endpoint: bounceEndpoint,
};
const complaintSubscriptionInput: SubscribeCommandInput = {
  Protocol: 'https',
  TopicArn: topicArnComplaint,
  Endpoint: complaintEndpoint,
};

const bounceSubscribeCommand = new SubscribeCommand(bounceSubscriptionInput);
const complaintSubscribeCommand = new SubscribeCommand(complaintSubscriptionInput);

client.send(bounceSubscribeCommand).then(
  (data) => {
    console.log(`Bounce SNS subscription set up successfully: ${JSON.stringify(data)}`);
  },
  (error) => {
    console.error(`Unable to set up Bounce SNS subscription: ${error}`);
  }
);

client.send(complaintSubscribeCommand).then(
  (data) => {
    console.log(`Complaint SNS subscription set up successfully: ${JSON.stringify(data)}`);
  },
  (error) => {
    console.error(`Unable to set up Complaint SNS subscription: ${error}`);
  }
);
const handleSnsNotification = async (req: Request) => {
  const message = JSON.parse(req.body.Message);
  if ((message && message.notificationType == 'Bounce') || message.notificationType == 'Complaint') {
    const mail = message.mail;
    if (mail && mail.destination) {
      try {
        const users = await User.find({
          where: {
            email: In(mail.destination),
          },
        });

        const disabledEmailUsers = users.map((x) => {
          x.isEmailActive = false;
          return x;
        });

        await User.save(disabledEmailUsers);
      } catch (error) {
        console.error(error.message);
      }
    }
  }
};

const handleResponse = async (topicArn: string, req: Request) => {
  if (req.headers['x-amz-sns-message-type'] === 'Notification' && req.body.Message) {
    await handleSnsNotification(req);
  } else if (req.headers['x-amz-sns-message-type'] === 'SubscriptionConfirmation') {
    const confirmSubscriptionInput: ConfirmSubscriptionCommandInput = { Token: req.body.Token, TopicArn: topicArn };
    const confirmSubscriptionCommand = new ConfirmSubscriptionCommand(confirmSubscriptionInput);

    try {
      await client.send(confirmSubscriptionCommand);
    } catch (err) {
      console.error(err);
    }
  }
};

router.post('/email-bounces', express.json(), async (req, res) => {
  try {
    await handleResponse(topicArnBounce, req);
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

router.post('/email-complaints', express.json(), async (req, res) => {
  try {
    await handleResponse(topicArnComplaint, req);
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
});

export default router;
