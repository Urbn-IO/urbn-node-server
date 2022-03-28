import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@ObjectType()
@Entity()
export class CallTokens extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Index()
  @Column()
  requestId!: number;

  @Field()
  @Column({ unique: true })
  token!: string;

  @Field()
  @Column({ unique: true })
  roomName!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;
}
