import { Field, ObjectType } from 'type-graphql';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SignInMethod } from 'types';
import { Celebrity } from './Celebrity';
import { Role } from './Role';
import { Shoutout } from './Shoutout';

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ unique: true, type: 'uuid' })
  userId: string;

  @Field()
  @Column()
  displayName: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column({ default: true })
  isEmailActive: boolean;

  @Column({ nullable: true })
  password: string;

  @Field(() => String)
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column()
  sessionKey: string;

  @Field(() => SignInMethod)
  @Column({ type: 'enum', enum: SignInMethod, default: SignInMethod.BASIC })
  authMethod: SignInMethod;

  @Field(() => Celebrity, { nullable: true })
  @OneToOne(() => Celebrity, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn()
  celebrity?: Celebrity;

  @OneToMany(() => Role, (role) => role.user, { cascade: true })
  userRoles: Role[];

  @Field(() => [Shoutout], { nullable: true })
  @OneToMany(() => Shoutout, (shoutout) => shoutout.user)
  shoutouts: Shoutout[];

  // @Field(() => [CardAuthorization], { nullable: true })
  // @OneToMany(() => CardAuthorization, (card) => card.user, {
  //   nullable: true,
  // })
  // cards: CardAuthorization[];
}
