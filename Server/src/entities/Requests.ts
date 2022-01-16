import { requestStatus } from "../types";
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
  recepientAlias!: string;

  @Field()
  @Column()
  requestType!: string;

  @Field()
  @Column()
  requestAmountInNaira!: string;

  @Field()
  @Column()
  description!: string;

  @Column({ type: "enum", enum: requestStatus, default: requestStatus.PENDING })
  status: requestStatus;

  @Field()
  @Column({ type: "timestamptz" })
  requestExpires!: Date;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
