import { join } from 'path';
import { DataSource } from 'typeorm';
import { __prod__ } from 'constant';
import { entities } from 'register';

const AppDataSource = new DataSource({
  type: 'postgres',
  database: process.env.DATABASE_NAME,
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  logging: !__prod__,
  synchronize: true,
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
