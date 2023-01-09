import { join } from 'path';
import { DataSource } from 'typeorm';
import { entities } from '../register';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  logging: true,
  synchronize: false,
  migrations: [join(__dirname, './migrations/*')],
  entities,
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });

export default AppDataSource;
