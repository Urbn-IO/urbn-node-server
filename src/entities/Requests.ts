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
  @Column({ nullable: true })
  requestorName?: string;

  @Field()
  @Column()
  recepient!: string;

  @Field()
  @Column()
  recepientAlias!: string;

  @Field()
  @Column({ nullable: true })
  recepientThumbnail!: string;

  @Field()
  @Column({ type: "enum", enum: RequestType, default: RequestType.SHOUTOUT })
  requestType: RequestType;

  @Field()
  @Column()
  requestAmountInNaira!: string;

  @Field()
  @Column()
  description: string;

  @Field()
  @Index()
  @Column({ type: "enum", enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

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
