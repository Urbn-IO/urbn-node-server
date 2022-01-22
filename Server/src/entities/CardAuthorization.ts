import { Field, Int, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class CardAuthorization extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: string;

  @Column()
  accountName!: string;

  @Column()
  email!: string;

  @Column()
  authorizationCode!: string;

  @Field()
  @Column()
  cardType!: string;

  @Field()
  @Column()
  last4!: string;

  @Column()
  expMonth!: string;

  @Column()
  expYear!: string;

  @Column()
  bin!: string;

  @Field()
  @Column()
  bank!: string;

  @Column()
  channel!: string;

  @Column()
  signature!: string;

  @Column()
  reusable!: boolean;

  @Column()
  countryCode!: string;

  @ManyToOne(() => User, (user) => user.cards)
  user: User;
}
