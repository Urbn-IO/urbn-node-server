import { requestStatus } from "../types";
import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@ObjectType()
@Entity()
export class Requests extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  requestor!: string;

  @Field()
  @Column({ nullable: true })
  requestorName?: string;

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

  @Field()
  @Column({ type: "enum", enum: requestStatus, default: requestStatus.PENDING })
  status: requestStatus;

  @Field(() => String)
  @Column()
  requestExpires!: Date;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
