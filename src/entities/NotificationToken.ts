import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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
  @Column()
  devicePlatform: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  pushKitToken?: string;

  @Field()
  @Column({ unique: true })
  notificationToken: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
