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
import { DayOfTheWeek } from "../types";

@ObjectType()
@Entity()
@Tree("closure-table")
@Index(["celebId", "level", "locked"])
export class CallSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column()
  @Index()
  celebId: number;

  @Field()
  @Column({ type: "enum", enum: DayOfTheWeek })
  @Index()
  day: DayOfTheWeek;

  @Field(() => String)
  @Column({ type: "time" })
  startTime: Date;

  @Field(() => String)
  @Column({ type: "time" })
  endTime: Date;

  @Column({ default: true })
  available: boolean;

  @Column({ default: false })
  locked: boolean;

  @Field(() => [CallSchedule], { nullable: true })
  @TreeChildren()
  children: CallSchedule[];

  @Field(() => CallSchedule, { nullable: true })
  @TreeParent()
  parent: CallSchedule;

  @Field()
  @TreeLevelColumn()
  @Column()
  level: number;
}
