import { RequestStatus, RequestType } from "../types";
import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

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
  @Column()
  requestorName: string;

  @Field()
  @Column()
  recipient!: string;

  @Field()
  @Column()
  recipientAlias!: string;

  @Field()
  @Column({ nullable: true })
  recipientThumbnail!: string;

  @Field()
  @Column({ type: "enum", enum: RequestType, default: RequestType.SHOUTOUT })
  requestType: RequestType;

  @Field()
  @Column()
  amount!: string;

  @Field()
  @Column()
  description: string;

  @Field()
  @Index()
  @Column({ type: "enum", enum: RequestStatus, default: RequestStatus.PROCESSING })
  status: RequestStatus;

  @Index()
  @Column()
  paymentRef: string;

  @Index()
  @Column({ nullable: true })
  callScheduleId: number;

  @Column({ nullable: true })
  callDurationInSeconds: number;

  @Column({ default: 0 })
  callAttempts: number;

  @Field(() => String)
  @Column({ type: "timestamp", nullable: true })
  callRequestBegins: Date;

  @Field(() => String)
  @Column({ type: "timestamp" })
  requestExpires: Date;

  @Field(() => String)
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
