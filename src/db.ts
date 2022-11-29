import { join } from "path";
import { DataSource } from "typeorm";
import { __prod__ } from "./constants";
import { entities } from "./register";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  logging: true,
  synchronize: !__prod__,
  migrations: [join(__dirname, "./migrations/*")],
  entities,
});
