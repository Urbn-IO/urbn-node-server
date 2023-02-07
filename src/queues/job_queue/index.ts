import {
    initializeCallStatusWorker,
    initializeEmailWorker,
    initializeRequestExpiration,
    initializeRequestReminderWorker,
} from './worker';

const initializeWorkers = () => {
    initializeEmailWorker();
    initializeCallStatusWorker();
    initializeRequestExpiration();
    initializeRequestReminderWorker();
};

export default initializeWorkers;
