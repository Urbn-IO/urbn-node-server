import { Field, ObjectType } from 'type-graphql';
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './User';

@ObjectType()
@Entity()
export class Shoutout extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  celebId: string;

  @Field()
  @Column()
  celebAlias: string;

  @Column()
  workFlowId: string;

  @Column()
  srcVideo: string;

  @Field()
  @Column()
  hlsUrl: string;

  @Field()
  @Column()
  mp4Url: string;

  @Field()
  @Column()
  thumbnailUrl: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  shareUrl: string;

  @Field()
  @Column()
  durationInSeconds: string;

  @Field(() => String)
  @Column({ type: 'timestamp' })
  datePublished: Date;

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.shoutouts)
  user: User;
}
