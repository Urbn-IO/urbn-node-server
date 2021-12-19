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
import { Celebrity } from "./Celebrity";
import { CelebCategories } from "./CelebCategories";

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

  @OneToMany(() => CelebCategories, (celebCat) => celebCat.category)
  celebConn: Promise<CelebCategories[]>;
  //dataloader takes in the categoryId and mappes the Id to the celebs
  @Field(() => [Celebrity], { nullable: true })
  async celebs(
    @Ctx() { celebsLoader }: AppContext
  ): Promise<Celebrity[] | null> {
    return celebsLoader.load(this.id);
  }
}
