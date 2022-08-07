import { config } from "../../constants";
import redisClient from "../../redis/client";
import { addJob, createQueue } from "../../queues/jobQueue/producer";
import createWorker from "../../queues/jobQueue/worker";
import { SendTemplatedEmailCommandInput } from "@aws-sdk/client-ses";
import { EmailBaseInput, EmailTemplates } from "../../types";

const redis = redisClient;
const queue = createQueue("mail", redis);

//'"Foo Ifeanyi 👻" <Ifyfoo@example.com>'
const sendMail = async (
  source: string,
  template: EmailTemplates,
  destinationAddresses: string[],
  data: EmailBaseInput,
  ccAddresses?: string[]
) => {
  // const data: SendEmailCommandInput = {
  //   Source: "nnamdi@geturbn.io",
  //   Destination: { ToAddresses: ["ogbunnamdi@gmail.com"] },
  //   Message: {
  //     Subject: { Data: "Test message 2 from node server", Charset: "UTF-8" },
  //     Body: {
  //       Html: {
  //         Data: `<h1 style="background-color: pink">Happy to see you work!!</h1>`,
  //         Charset: "UTF-8",
  //       },
  //       Text: {
  //         Data: '"Foo Ifeanyi 👻" <Ifyfoo@example.com>',
  //         Charset: "UTF-8",
  //       },
  //     },
  //   },
  // };

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
    const pathToProcessor = `${config.APP_ROOT}/services/mail/transport`;
    const worker = createWorker("mail", pathToProcessor, redis);
    worker.on("active", (job) => console.log(`job with ${job.id} is active`));
    worker.on("completed", async (job) => {
      console.log(`Completed job ${job.id} successfully`);
      worker.close();
    });
    worker.on("failed", (job, err) => console.log(`Failed job ${job.id} with ${err}`));
  }
};

export default sendMail;
