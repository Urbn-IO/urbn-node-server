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
import { CacheControl } from "../cache/cacheControl";
import { CacheScope } from "apollo-server-types";

@ObjectType()
@Entity()
@CacheControl({ maxAge: 300, scope: CacheScope.Public })
export class Celebrity extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, type: "uuid" })
  userId!: string;

  @Field()
  @Column()
  alias: string;

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

  @Field()
  @Column()
  description: string;

  @Field()
  @Column({ default: false })
  acceptsShoutout: boolean;

  @Field()
  @Column({ default: false })
  acceptsInstantShoutout: boolean;

  @Field()
  @Column({ default: false })
  acceptsCallTypeA: boolean;
  @Field()
  @Column({ default: false })
  acceptsCallTypeB: boolean;

  @Field(() => Int, { defaultValue: 0 })
  @Column({ nullable: true })
  shoutout: number;

  @Field(() => Int, { defaultValue: 0 })
  instantShoutout: number;

  @Field(() => Int, { defaultValue: 0 })
  @Column({ nullable: true })
  callTypeA: number;

  @Field(() => Int, { defaultValue: 0 })
  @Column({ nullable: true })
  callTypeB: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  profileHash: string;

  @Field(() => String)
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @OneToMany(() => CelebCategories, (userCat) => userCat.celebrity)
  categoriesConn: Promise<CelebCategories[]>;

  //dataloader takes in the userId and maps the Id to the categories
  @Field(() => [Categories], { nullable: true })
  async categories(@Ctx() { categoriesLoader }: AppContext): Promise<Categories[] | null> {
    return categoriesLoader.load(this.id);
  }
}
