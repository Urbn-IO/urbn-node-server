import { connection } from './connection';

const dataSource = connection(true);

dataSource
  .initialize()
  .then(() => {
    console.log('Test Data Source has been initialized!');
    process.exit();
  })
  .catch((err) => {
    console.error('Error during Test Data Source initialization', err);
  });
