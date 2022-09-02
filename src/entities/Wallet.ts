import { Field, ObjectType } from "type-graphql";
import { Entity, BaseEntity, Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from "typeorm";
import { Currency } from "../types";

@ObjectType()
@Entity()
export class Wallet extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column({ default: "0" })
  balance: string;

  @Field(() => Currency)
  @Column({ type: "enum", enum: Currency, default: Currency.NAIRA })
  currency: Currency;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}
