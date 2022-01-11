import { Field, ObjectType } from "type-graphql";
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
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  email!: string;

  @Field()
  @Column()
  authorizationCode!: string;

  @Field()
  @Column()
  cardType!: string;

  @Field()
  @Column()
  last4!: string;

  @Field()
  @Column()
  expMonth!: string;

  @Field()
  @Column()
  expYear!: string;

  @Field()
  @Column()
  bin!: string;

  @Field()
  @Column()
  bank!: string;

  @Field()
  @Column()
  channel!: string;

  @Field()
  @Column()
  signature!: string;

  @Field()
  @Column()
  reusable!: boolean;

  @Field()
  @Column()
  country_code!: string;

  @ManyToOne(() => User, (user) => user.cards)
  user: User;
}
