import { Field, Int, ObjectType } from "type-graphql";
import {
  Entity,
  Tree,
  Column,
  PrimaryGeneratedColumn,
  TreeChildren,
  TreeParent,
  Index,
  TreeLevelColumn,
} from "typeorm";

@ObjectType()
@Entity()
@Tree("closure-table")
export class CallSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column()
  @Index()
  celebId: number;

  @Field()
  @Column({ type: "uuid", nullable: true })
  @Index()
  callerUserId: string;

  @Field(() => Int)
  @Column()
  @Index()
  day: number;

  @Field(() => String)
  @Column({ type: "timestamp", nullable: true })
  startTime: Date;

  @Field(() => String)
  @Column({ type: "timestamp", nullable: true })
  endTime: Date;

  @Column({ default: true })
  available: boolean;

  @Column({ default: false, nullable: true })
  locked: boolean;

  @TreeChildren()
  children: CallSchedule[];

  @TreeParent()
  parent: CallSchedule;

  @TreeLevelColumn()
  @Column()
  level: number;
}
//
