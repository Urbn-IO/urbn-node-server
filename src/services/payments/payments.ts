import { TransactionsMetadata } from "../../types";
import paystack from "./paystack/paystack";

const initialize = () => {
  return {
    initializeCard: async (
      email: string,
      userId: string,
      amount: string,
      defaultCard = false
    ) => {
      const metadata: TransactionsMetadata = {
        userId,
        email,
        newCard: true,
        defaultCard,
      };
      const result = await paystack().initializePayment(
        email,
        amount,
        metadata
      );
      return result;
    },
  };
};

const verify = () => {
  return {
    verifyPayment: async (ref: string, newCard?: boolean) => {
      const result = await paystack().verifyPayment(ref, newCard);
      return result;
    },
  };
};

const pay = () => {
  return {
    chargeCard: async (
      email: string,
      amount: string,
      authCode: string,
      metadata?: TransactionsMetadata
    ) => {
      const result = await paystack().newPayment(
        email,
        amount,
        authCode,
        metadata
      );
      return result;
    },
  };
};

const paymentManager = () => {
  return {
    ...initialize(),
    ...verify(),
    ...pay(),
  };
};

export default paymentManager;
