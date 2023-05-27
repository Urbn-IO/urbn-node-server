import { BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Roles } from 'types';
import { User } from './User';

@Entity()
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: Roles, default: Roles.USER })
  role: Roles;

  @ManyToOne(() => User, (user) => user.userRoles, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
  user: User;
}
