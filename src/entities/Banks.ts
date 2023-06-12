import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
@Index(['name', 'bankCode'], { unique: true })
export class Banks extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  bankCode: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
