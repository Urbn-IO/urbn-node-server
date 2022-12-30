import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { PlatformOptions } from '../types';

@ObjectType()
@Entity()
export class NotificationToken extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ type: 'uuid', unique: true })
  @Index()
  userId: string;

  @Field()
  @Column()
  deviceId: string;

  @Field()
  @Column({ type: 'enum', enum: PlatformOptions })
  devicePlatform: PlatformOptions;

  @Field({ nullable: true })
  @Column({ nullable: true })
  pushkitToken?: string;

  @Field()
  @Column()
  notificationToken: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
