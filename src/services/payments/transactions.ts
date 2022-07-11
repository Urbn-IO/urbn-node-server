import { Transactions } from "../../entities/Transactions";

export const saveTransaction = async (payload: any) => {
  const { reference, channel, amount, currency, status, paid_at, created_at, metadata } = payload;

  try {
    await Transactions.create({
      customer: metadata.userId,
      recipient: metadata.recipient,
      currency,
      amount,
      reference,
      channel,
      status,
      paidAt: paid_at,
      createdAt: created_at,
    }).save();
  } catch (err) {
    console.error(err);
  }
};
