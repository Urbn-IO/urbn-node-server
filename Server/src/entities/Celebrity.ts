import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Ctx, Field, Int, ObjectType } from "type-graphql";
import { CelebCategories } from "./CelebCategories";
import { AppContext } from "../types";
import { Categories } from "./Categories";

@ObjectType()
@Entity()
export class Celebrity extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  userId!: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  alias?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnail: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  image: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  imageThumbnail: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  imagePlaceholder: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  @Field()
  @Column({ default: false })
  acceptShoutOut: boolean;

  @Field()
  @Column({ default: false })
  acceptsCalls: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  shoutOutRatesInNaira: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  _3minsCallRequestRatesInNaira: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  _5minsCallRequestRatesInNaira: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  fanRatings?: string;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
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
