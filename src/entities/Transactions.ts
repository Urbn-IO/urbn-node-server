import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Transactions extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  reference: string;

  @Column({ nullable: true })
  channel: string;

  @Column({ nullable: true })
  paid: boolean;

  @Column({ nullable: true })
  status: string;

  @Column({ type: "timestamp", nullable: true })
  paidAt: Date;

  @Column({ type: "timestamp", nullable: true })
  createdAt: Date;
}
