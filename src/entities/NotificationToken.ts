import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PlatformOptions } from "../types";

@ObjectType()
@Entity()
export class NotificationToken extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ type: "uuid" })
  @Index()
  userId: string;

  @Field()
  @Column({ unique: true })
  deviceId: string;

  @Field()
  @Column({ type: "enum", enum: PlatformOptions })
  devicePlatform: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  pushKitToken?: string;

  @Field()
  @Column()
  notificationToken: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
