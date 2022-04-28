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
export class CallTokens extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
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
