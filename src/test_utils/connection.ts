import { join } from 'path';
import { DataSource } from 'typeorm';
import { entities } from '../register';

export const connection = (drop = false) => {
  return new DataSource({
    type: 'postgres',
    username: 'test',
    password: 'test',
    database: 'test',
    logging: true,
    synchronize: drop,
    dropSchema: drop,
    migrations: [join(__dirname, './migrations/*')],
    entities,
  });
};
