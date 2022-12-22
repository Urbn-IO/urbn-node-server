import { CacheScope } from 'apollo-server-types';
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
import CacheControl from '../cache/cacheControl';
import { AppContext } from '../types';
import { CallSlots } from '../utils/graphqlTypes';
import { Categories } from './Categories';
import { CelebCategories } from './CelebCategories';

@ObjectType()
@Entity()
@CacheControl({ maxAge: 300, scope: CacheScope.Public })
export class Celebrity extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ default: true })
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

  @Field(() => [CallSlots], { nullable: true })
  @Column('jsonb', { array: false, default: () => "'[]'", nullable: true })
  availableTimeSlots: CallSlots[];

  @Column({ nullable: true })
  twitter: string;

  @Column({ nullable: true })
  facebook: string;

  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  profileHash: string;

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => CelebCategories, (userCat) => userCat.celebrity)
  categoriesConn: Promise<CelebCategories[]>;

  //dataloader takes in the userId and maps the Id to the categories
  @Field(() => [Categories], { nullable: true })
  async categories(@Ctx() { categoriesLoader }: AppContext): Promise<Categories[] | null> {
    return categoriesLoader.load(this.id);
  }
}
