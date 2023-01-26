import { TransactionsMetadata } from '../../types';
import paystack from './paystack/api';

const initialize = () => {
  return {
    initializePayment: async <T>(email: string, amount: string, metadata: T) => {
      const result = await paystack().initializePayment(email, amount, metadata);
      return result;
    },
  };
};

const verify = () => {
  return {
    verifyPayment: async (ref: string) => {
      const result = await paystack().verifyPayment(ref);
      return result;
    },
  };
};

const pay = () => {
  return {
    chargeCard: async (email: string, amount: string, authCode: string, metadata?: TransactionsMetadata) => {
      const result = await paystack().newPayment(email, amount, authCode, metadata);
      return result;
    },
  };
};

const verifyAccount = () => {
  return {
    verifyAccountNumber: async (bankCode: string, acctNumber: string) => {
      const result = await paystack().verifyAccountNumber(bankCode, acctNumber);
      return result;
    },
  };
};

const paymentManager = () => {
  return {
    ...initialize(),
    ...verify(),
    ...pay(),
    ...verifyAccount(),
  };
};

export default paymentManager;
