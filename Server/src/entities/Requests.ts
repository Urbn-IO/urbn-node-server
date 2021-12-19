import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@ObjectType()
@Entity()
export class Requests extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  requester!: string;

  @Field()
  @Column()
  recepient!: string;

  @Field()
  @Column()
  requestType!: string;

  @Field()
  @Column()
  requestAmountInNaira!: string;

  @CreateDateColumn()
  createdAt: Date;
}
