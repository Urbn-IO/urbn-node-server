import { RequestStatus, RequestType } from "../types";
import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@ObjectType()
@Entity()
@Index(["user", "celebrity"])
@Index(["user", "reference"])
export class Requests extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reference: string;

  @Field()
  @Column()
  user: string;

  @Field()
  @Column()
  userDisplayName: string;

  @Field()
  @Column()
  celebrity: string;

  @Field()
  @Column()
  celebrityAlias: string;

  @Field()
  @Column()
  celebrityThumbnail: string;

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
  @Column({ type: "enum", enum: RequestStatus, default: RequestStatus.VALIDATING })
  status: RequestStatus;

  @Index()
  @Column({ nullable: true })
  callSlotId: string;

  @Column({ nullable: true })
  callDurationInSeconds: string;

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
