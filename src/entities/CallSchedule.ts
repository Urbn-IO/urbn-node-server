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

  @Field({ nullable: true })
  @Column({ type: "uuid", nullable: true })
  @Index()
  callerUserId: string;

  @Field(() => Int)
  @Column()
  @Index()
  day: number;

  @Field(() => String)
  @Column({ type: "time", nullable: true })
  startTime: Date;

  @Field(() => String)
  @Column({ type: "time", nullable: true })
  endTime: Date;

  @Column({ default: true })
  available: boolean;

  @Column({ default: false, nullable: true })
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
