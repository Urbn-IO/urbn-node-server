import { AppContext } from "src/types";
import { Ctx, Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { UserCategories } from "./UserCategories";

@ObjectType()
@Entity()
export class Categories extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  name!: string;

  @Field(() => Boolean)
  @Column()
  recommendable!: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserCategories, (userCat) => userCat.category)
  UserConn: Promise<UserCategories[]>;
  //dataloader takes in the categoryId and mappes the Id to the users
  @Field(() => [User], { nullable: true })
  async users(@Ctx() { usersLoader }: AppContext): Promise<User[] | null> {
    return usersLoader.load(this.id);
  }
}
