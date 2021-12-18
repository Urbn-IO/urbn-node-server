import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
} from "typeorm";
import { Ctx, Field, ObjectType } from "type-graphql";
import { CelebCategories } from "./CelebCategories";
import { AppContext } from "src/types";
import { Categories } from "./Categories";

@ObjectType()
@Entity()
export class Celebrity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  alias?: string;

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

  @OneToMany(() => CelebCategories, (userCat) => userCat.celebrity)
  categoriesConn: Promise<CelebCategories[]>;

  //dataloader takes in the userId and mapes the Id to the categories
  @Field(() => [Categories], { nullable: true })
  async categories(
    @Ctx() { categoriesLoader }: AppContext
  ): Promise<Categories[] | null> {
    return categoriesLoader.load(this.id);
  }
}
