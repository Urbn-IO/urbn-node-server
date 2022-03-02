import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Shoutout extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  celebId!: string;

  @Field()
  @Column({ unique: true })
  video!: string;

  @Field()
  @Column({ unique: true })
  thumbnail!: string;

  @ManyToOne(() => User, (user) => user.shoutouts)
  user: User;
}
