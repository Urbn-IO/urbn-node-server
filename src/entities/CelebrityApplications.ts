import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CelebrityApplications extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: string;

  @Column({ unique: true })
  email: string;

  @Column()
  alias: string;

  @Column({ nullable: true })
  twitter: string;

  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  facebook: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
