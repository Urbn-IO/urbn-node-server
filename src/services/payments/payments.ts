import paystack from "./paystack";

const initialize = () => {
  return {
    initializeCard: async (email: string, userId: string, amount: string) => {
      const result = await paystack().initializePayment(email, userId, amount);
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
    chargeCard: async (email: string, amount: string, authCode: string, ref: string) => {
      const result = await paystack().newPayment(email, amount, authCode, ref);
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
