import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Requests } from './Requests';

@Entity()
export class Report extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean' })
  reporterIsCeleb: boolean;

  @Column()
  reporter: string;

  @Column()
  offender: string;

  @Column()
  description: string;

  @OneToOne(() => Requests, { nullable: true })
  @JoinColumn()
  request?: Requests;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
