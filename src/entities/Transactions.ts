import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Currency, PaymentGateway, PaymentStatus } from 'types';

@Entity()
@Index(['customer', 'recipientCeleb'])
export class Transactions extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ type: 'uuid' })
  customer: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  recipientCeleb?: string;

  @Column({ unique: true })
  reference: string;

  @Column()
  amount: string;

  @Column({ type: 'enum', enum: Currency, default: Currency.NAIRA })
  currency: Currency;

  @Column()
  channel: string;

  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
    default: PaymentGateway.PAYSTACK,
  })
  gateway: PaymentGateway;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  createdAt: Date;
}
