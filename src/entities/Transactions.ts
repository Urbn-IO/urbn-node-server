import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@Index(["customer", "recipient"])
export class Transactions extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: "uuid" })
  customer: string;

  @Index()
  @Column({ type: "uuid" })
  recipient: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  amount: string;

  @Column()
  currency: string;

  @Column()
  channel: string;

  @Column()
  status: string;

  @Column({ type: "timestamp", nullable: true })
  paidAt: Date;

  @Column({ type: "timestamp", nullable: true })
  createdAt: Date;
}
