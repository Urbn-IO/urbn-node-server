import { SendTemplatedEmailCommandInput } from '@aws-sdk/client-ses';
import { addJob, mailQueue } from '../../../queues/job_queue/producer';
import { EmailInput, EmailTemplate } from '../../../types';

const sendTemplatedMail = async (
    source: string,
    template: EmailTemplate,
    destinationAddresses: string[],
    data: EmailInput,
    ccAddresses?: string[]
) => {
    const templateData = JSON.stringify(data);

    const mail: SendTemplatedEmailCommandInput = {
        Source: source,
        Destination: {
            ToAddresses: destinationAddresses,
            CcAddresses: ccAddresses,
        },
        Template: template,
        TemplateData: templateData,
    };

    await addJob(mailQueue, 'email', mail, {
        attempts: 5,
        backoff: { type: 'exponential', delay: 60000 },
        removeOnFail: true,
        removeOnComplete: true,
    });
};

export default sendTemplatedMail;
