import { initializeCallStatusWorker, initializeEmailWorker, initializeRequestExpiration } from './worker';

const initializeWorkers = () => {
    initializeEmailWorker();
    initializeCallStatusWorker();
    initializeRequestExpiration();
};

export default initializeWorkers;
