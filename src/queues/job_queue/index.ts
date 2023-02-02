import { callStatusWorker, mailWorker, operationsWorker } from './worker';

const initializeWorkers = () => {
  callStatusWorker.on('active', (job) => console.log(`job with ${job.id} is active`));
  callStatusWorker.on('completed', async (job) => console.log(`Completed job ${job.id} successfully`));
  callStatusWorker.on('failed', (job, err) => console.log(`Failed job ${job?.id} with ${err}`));

  mailWorker.on('active', (job) => console.log(`job with ${job.id} is active`));
  mailWorker.on('completed', async (job) => console.log(`Completed job ${job.id} successfully`));
  mailWorker.on('failed', (job, err) => console.log(`Failed job ${job?.id} with ${err}`));

  operationsWorker.on('active', (job) => console.log(`job with ${job.id} is active`));
  operationsWorker.on('completed', async (job) => console.log(`Completed job ${job.id} successfully`));
  operationsWorker.on('failed', (job, err) => console.log(`Failed job ${job?.id} with ${err}`));

  console.log('Job Queue workers listening for events');
};

export default initializeWorkers;
