import path from "path";
import { DataSource } from "typeorm";
import { __prod__ } from "./constants";
import { entities } from "./register";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  logging: true,
  synchronize: !__prod__,
  migrations: [path.join(__dirname, "./migrations/*")],
  entities,
});

// const delayInMilliseconds = 1000; //1 second

// setTimeout(async () => {
//   await AppDataSource.runMigrations();
// }, delayInMilliseconds);
