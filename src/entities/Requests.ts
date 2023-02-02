import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { RequestStatus, RequestType } from '../types';

@ObjectType()
@Entity()
@Index(['customer', 'celebrity'])
@Index(['customer', 'reference'])
export class Requests extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true })
  reference: string;

  @Field()
  @Column()
  customer: string;

  @Field()
  @Column()
  customerDisplayName: string;

  @Field()
  @Column()
  celebrity: string;

  @Field()
  @Column()
  celebrityAlias: string;

  @Field()
  @Column({ type: 'enum', enum: RequestType, default: RequestType.SHOUTOUT })
  requestType: RequestType;

  @Field()
  @Column()
  amount!: string;

  @Field()
  @Column()
  description: string;

  @Field()
  @Index()
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    nullable: true,
  })
  prevStatus?: RequestStatus;

  @Index()
  @Column({ nullable: true })
  callSlotId: string;

  @Column({ nullable: true })
  callDurationInSeconds: string;

  @Column({ default: 0 })
  callAttempts: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  callRequestBegins: Date;

  @Field(() => String)
  @Column({ type: 'timestamp' })
  requestExpires: Date;

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
