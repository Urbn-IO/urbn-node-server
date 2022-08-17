import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CacheControl } from "../cache/cacheControl";
import { CardAuthorization } from "./CardAuthorization";
import { Celebrity } from "./Celebrity";
import { Shoutout } from "./Shoutout";
import { CacheScope } from "apollo-server-types";
import { SignInMethod } from "../types";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true, type: "uuid" })
  userId: string;

  @Field()
  @Column()
  displayName: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Field(() => String)
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Column()
  sessionKey: string;

  @Field()
  @Column({ type: "enum", enum: SignInMethod, default: SignInMethod.BASIC })
  authMethod: SignInMethod;

  @Field({ nullable: true })
  @CacheControl({ maxAge: 60, scope: CacheScope.Private })
  @OneToOne(() => Celebrity, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn()
  celebrity?: Celebrity;

  @Field(() => [Shoutout], { nullable: true })
  @OneToMany(() => Shoutout, (shoutout) => shoutout.user)
  shoutouts: Shoutout[];

  @Field(() => [CardAuthorization], { nullable: true })
  @OneToMany(() => CardAuthorization, (card) => card.user, {
    nullable: true,
  })
  cards: CardAuthorization[];
}
