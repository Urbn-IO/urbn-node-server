import { dbConfig, __prod__ } from "./constants";
import { Post } from "./entities/post";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { User } from "./entities/User";
import { Categories } from "./entities/Categories";

export default {
  entities: [Post, User, Categories],
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  dbName: dbConfig.dbName,
  user: dbConfig.user,
  type: "postgresql",
  password: dbConfig.password,
  debug: !__prod__,
} as Parameters<typeof MikroORM.init>[0];
