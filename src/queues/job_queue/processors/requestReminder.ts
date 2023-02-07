import { Job } from 'bullmq';
import { Requests } from 'entities/Requests';
import { sendInstantNotification } from 'services/notifications/handler';

const requestReminder = async (request: Requests) => {
    const userId = request.customer;
    await sendInstantNotification(
        [userId],
        'Video call in 30 mins! 📞',
        `You have a video call session with ${request.celebrityAlias} in about 30 minutes. Get ready!`
    );
};

export default async (job: Job<Requests>) => await requestReminder(job.data);
