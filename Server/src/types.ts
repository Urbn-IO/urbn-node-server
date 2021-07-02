import { EntityManager, IDatabaseDriver, Connection } from "@mikro-orm/core";

export type Mycontext = {
  em: EntityManager<IDatabaseDriver<Connection>>;
};
