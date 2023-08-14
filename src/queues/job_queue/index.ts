import {
  initializeAlertsWorker,
  initializeCallStatusWorker,
  initializeEmailWorker,
  initializeRequestExpiration,
} from './worker';

const initializeWorkers = () => {
  initializeEmailWorker();
  initializeCallStatusWorker();
  initializeRequestExpiration();
  initializeAlertsWorker();
};

export default initializeWorkers;
