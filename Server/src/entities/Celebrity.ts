import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Ctx, Field, ObjectType } from "type-graphql";
import { CelebCategories } from "./CelebCategories";
import { AppContext } from "../types";
import { Categories } from "./Categories";

@ObjectType()
@Entity()
export class Celebrity extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  userId!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  alias?: string;

  @Field()
  @Column()
  description: string;

  @Field()
  @Column()
  acceptsVideoRequests: boolean;

  @Field()
  @Column()
  acceptsCallRequets: boolean;

  @Field()
  @Column()
  videoRequestRatesInNaira: string;

  @Field()
  @Column()
  callRequestRatesInNaira: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  fanRatings?: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @OneToMany(() => CelebCategories, (userCat) => userCat.celebrity)
  categoriesConn: Promise<CelebCategories[]>;

  //dataloader takes in the userId and maps the Id to the categories
  @Field(() => [Categories], { nullable: true })
  async categories(
    @Ctx() { categoriesLoader }: AppContext
  ): Promise<Categories[] | null> {
    return categoriesLoader.load(this.id);
  }
}
