import { Transactions } from "../../entities/Transactions";

export const saveTransaction = async (payload: any) => {
  const { reference, channel, status, paid_at, created_at } = payload;

  try {
    await Transactions.create({
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
