import { Ctx, Field, Int, ObjectType } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import CacheControl from 'cache/cacheControl';
import { AppContext } from 'types';
import { CelebCategories } from './CelebCategories';
import { Celebrity } from './Celebrity';
@ObjectType()
@Entity()
@CacheControl({ maxAge: 300 })
export class Categories extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field(() => Boolean)
  @Column({ default: false })
  recommendable: boolean;

  @Field(() => Boolean)
  @Index()
  @Column({ default: false })
  primary: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnail: string;

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @OneToMany(() => CelebCategories, (celebCat) => celebCat.category, { onDelete: 'CASCADE' })
  celebConn: Promise<CelebCategories[]>;
  //dataloader takes in the categoryId and maps the Id to the celebs
  @Field(() => [Celebrity], { nullable: true })
  async celebs(@Ctx() { celebsLoader }: AppContext): Promise<Celebrity[] | null> {
    return celebsLoader.load(this.id);
  }
}
