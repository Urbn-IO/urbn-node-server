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
import { Categories } from "./Categories";
import { UserCategories } from "./UserCategories";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
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

  @OneToMany(() => UserCategories, (userCat) => userCat.user)
  categoriesConn: Promise<UserCategories[]>;

  //dataloader takes in the userId and mappes the Id to the categories
  @Field(() => [Categories], { nullable: true })
  async categories(
    @Ctx() { categoriesLoader }: AppContext
  ): Promise<Categories[] | null> {
    return categoriesLoader.load(this.id);
  }
}
