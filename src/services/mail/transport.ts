import { SendTemplatedEmailCommand, SendTemplatedEmailCommandInput } from "@aws-sdk/client-ses";
import { Job } from "bullmq";
import client from "../aws/clients/ses/client";

export default async (job: Job<SendTemplatedEmailCommandInput>) =>
  await client.send(new SendTemplatedEmailCommand(job.data));
