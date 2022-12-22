import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Earnings extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Index()
  @Column()
  celebId: number;

  @Field()
  @Column()
  allTime: string;

  @Field()
  @Column()
  currentYear: string;

  @Field()
  @Column()
  jan: string;

  @Field()
  @Column()
  feb: string;

  @Field()
  @Column()
  mar: string;

  @Field()
  @Column()
  apr: string;

  @Field()
  @Column()
  may: string;

  @Field()
  @Column()
  june: string;

  @Field()
  @Column()
  july: string;

  @Field()
  @Column()
  aug: string;

  @Field()
  @Column()
  sept: string;

  @Field()
  @Column()
  oct: string;

  @Field()
  @Column()
  nov: string;

  @Field()
  @Column()
  dec: string;
}
