// import {
//   BaseEntity,
//   Entity,
//   JoinColumn,
//   ManyToOne,
//   PrimaryColumn,
// } from "typeorm";
// import { Categories } from "./Categories";
// import { User } from "./User";

// @Entity()
// export class UserCategories extends BaseEntity {
//   @PrimaryColumn()
//   userId: number;

//   @PrimaryColumn()
//   categoryId: number;

//   @ManyToOne(() => User, (user) => user.categoriesConn, { primary: true })
//   @JoinColumn({ name: "userId" })
//   user: Promise<User>;

//   @ManyToOne(() => Categories, (categories) => categories.UserConn, {
//     primary: true,
//   })
//   @JoinColumn({ name: "userId" })
//   category: Promise<Categories>;
// }
