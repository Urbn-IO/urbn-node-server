import { Field, Int, ObjectType } from "type-graphql";
import { Entity, Tree, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent, Index, BaseEntity } from "typeorm";
import { DayOfTheWeek } from "../types";

@ObjectType()
@Entity("call_schedule")
@Tree("closure-table")
export class CallScheduleBase extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => Int)
  @Column()
  @Index()
  celebId: number;

  @Column({ nullable: true })
  @Index()
  available: boolean;

  @Field(() => DayOfTheWeek, { nullable: true })
  @Column({ type: "enum", enum: DayOfTheWeek, nullable: true })
  @Index()
  day?: DayOfTheWeek;

  @Field(() => String, { nullable: true })
  @Column({ type: "time", nullable: true })
  startTime: Date;

  @Field(() => String, { nullable: true })
  @Column({ type: "time", nullable: true })
  endTime: Date;

  @Field(() => [CallScheduleBase], { nullable: true })
  @TreeChildren({ cascade: ["insert", "update", "remove", "soft-remove", "recover"] })
  children: CallScheduleBase[];

  @Field(() => CallScheduleBase, { nullable: true })
  @TreeParent({ onDelete: "CASCADE" })
  parent: CallScheduleBase;
}
