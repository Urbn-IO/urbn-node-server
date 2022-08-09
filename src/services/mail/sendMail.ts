import { config } from "../../constants";
import redisClient from "../../redis/client";
import { addJob, createQueue } from "../../queues/jobQueue/producer";
import createWorker from "../../queues/jobQueue/worker";
import { SendTemplatedEmailCommandInput } from "@aws-sdk/client-ses";
import { EmailBaseInput, EmailTemplates } from "../../types";

const redis = redisClient;
const pathToProcessor = `${config.APP_ROOT}/services/mail/transport`;
const queue = createQueue(config.MAIL_QUEUE_NAME, redis);

//'"Foo Ifeanyi 👻" <Ifyfoo@example.com>'
const sendTemplatedMail = async (
  source: string,
  template: EmailTemplates,
  destinationAddresses: string[],
  data: EmailBaseInput,
  ccAddresses?: string[]
) => {
  const templateData = JSON.stringify(data);

  const mail: SendTemplatedEmailCommandInput = {
    Source: source,
    Destination: { ToAddresses: destinationAddresses, CcAddresses: ccAddresses },
    Template: template,
    TemplateData: templateData,
  };

  const job = await addJob(queue, "simple-mail", mail, {
    removeOnComplete: true,
  });
  if (job) {
    const worker = createWorker(config.MAIL_QUEUE_NAME, pathToProcessor, redis);
    worker.on("active", (job) => console.log(`job with ${job.id} is active`));
    worker.on("completed", async (job) => {
      console.log(`Completed job ${job.id} successfully`);
      worker.close();
    });
    worker.on("failed", (job, err) => console.log(`Failed job ${job.id} with ${err.message}`));
    worker.on("error", (err) => console.error(err.message));
  }
};

export default sendTemplatedMail;
