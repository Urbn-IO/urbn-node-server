import CacheControl from 'cache/cacheControl';
import { Ctx, Field, Int, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AppContext, CelebPopularityIndex } from 'types';
import { CallSlots } from 'utils/graphqlTypes';
import { Categories } from './Categories';
import { CelebCategories } from './CelebCategories';

@ObjectType()
@Entity()
@CacheControl({ maxAge: 300 })
export class Celebrity extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  profileUrl?: string;

  @Field()
  @Column({ default: false })
  isNew: boolean;

  @Column({ unique: true, type: 'uuid' })
  userId: string;

  @Field()
  @Column()
  alias: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  videoBanner?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  placeholder?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  lowResPlaceholder?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
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

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'decimal' })
  shoutout: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  shoutoutIAP: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'decimal' })
  instantShoutout: number;

  //saving the IAP product id for instant shoutout to db
  @Field({ nullable: true })
  @Column({ nullable: true })
  instantShoutoutIAP: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'decimal' })
  callTypeA: number;

  @Field({ nullable: true })
  @Column({ nullable: true, type: 'decimal' })
  callTypeB: number;

  @Field(() => [CallSlots], { nullable: true })
  @Column('jsonb', { array: false, default: () => "'[]'", nullable: true })
  availableTimeSlots: CallSlots[];

  @Column({ nullable: true })
  accountName: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true })
  bankCode: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  profileHash: string;

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ default: CelebPopularityIndex.REGIONAL })
  popularityIndex: CelebPopularityIndex;

  @OneToMany(() => CelebCategories, (celebCat) => celebCat.celebrity, { cascade: ['remove'] })
  categoriesConn: Promise<CelebCategories[]>;

  //dataloader takes in the userId and maps the Id to the categories
  @Field(() => [Categories], { nullable: true })
  async categories(@Ctx() { categoriesLoader }: AppContext): Promise<Categories[] | null> {
    return categoriesLoader.load(this.id);
  }
}
