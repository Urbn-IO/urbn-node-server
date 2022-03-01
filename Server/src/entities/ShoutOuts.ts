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
export class ShoutOuts extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  celebId!: string;

  @Field()
  @Column({ unique: true })
  videoUrl!: string;

  @Field()
  @Column({ unique: true })
  thumbNailUrl!: string;

  @ManyToOne(() => User, (user) => user.shoutOuts)
  user: User;
}
