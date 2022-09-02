import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class CardAuthorization extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Boolean)
  @Column({ default: false })
  defaultCard: boolean;

  @Column({ nullable: true })
  accountName: string;

  @Column()
  email: string;

  @Column({ unique: true })
  authorizationCode: string;

  @Field()
  @Column()
  cardType: string;

  @Field()
  @Column()
  last4: string;

  @Field()
  @Column()
  expMonth: string;

  @Field()
  @Column()
  expYear: string;

  @Column()
  bin: string;

  @Field()
  @Column()
  bank: string;

  @Column()
  channel: string;

  @Column({ unique: true })
  signature: string;

  @Column()
  reusable: boolean;

  @Column()
  countryCode: string;

  @Field(() => String)
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.cards)
  user: User;
}
