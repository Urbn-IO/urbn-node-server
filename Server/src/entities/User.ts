import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  // OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
// import { Categories } from "./Categories";
// import { UserCategories } from "./UserCategories";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  userId!: string;

  @Field()
  @Column()
  firstName: string;

  @Field()
  @Column()
  lastName: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  nickName?: string;

  @Field(() => Boolean)
  @Column()
  celebrity!: boolean;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // @OneToMany(() => UserCategories, (userCat) => userCat.user)
  // categoriesConn: Promise<UserCategories[]>;

  // @Field(() => [Categories])
  // async categories(
  //   @Ctx() { categoriesLoader }: MyContext
  // ): Promise<Categories[]> {
  //   return categoriesLoader.load(this.id);
  // }
}
