import { Field } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, Index, Column, CreateDateColumn } from "typeorm";
import { Currency, PaymentGateway, PaymentStatus } from "../types";

@Entity()
export class WalletTransactions extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  userId: string;

  @Field()
  @Column()
  amount: string;

  @Field(() => Currency)
  @Column({ type: "enum", enum: Currency, default: Currency.NAIRA })
  currency: Currency;

  @Column({ type: "enum", enum: PaymentStatus })
  status: PaymentStatus;

  @Field()
  @Column()
  isInflow: boolean;

  @Column({ type: "enum", enum: PaymentGateway, default: PaymentGateway.PAYSTACK })
  gateway: PaymentGateway;

  @Field(() => String)
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;
}
