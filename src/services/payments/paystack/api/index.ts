import { PAYSTACK_API } from 'constant';
import { TransactionsMetadata } from 'types';
import { saveTransaction } from 'services/payments/transactions';

const initializeTransaction = (apiUrl: string, secretKey: string) => {
  return {
    initializePayment: async <T>(email: string, amount: string, metadata: T) => {
      const endpoint = `${apiUrl}/transaction/initialize`;
      const params = JSON.stringify({
        email,
        amount,
        channels: ['card'],
        metadata,
      });
      try {
        const response = await fetch(endpoint, {
          method: 'post',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
            'cache-control': 'no-cache',
          },
          body: params,
        });

        const payload = await response.json();

        const { status, message, data } = payload;
        if (!status) {
          throw new Error(message);
        }

        const authUrl = data.authorization_url as string;

        return authUrl;
      } catch (err) {
        console.error(err);
        return null;
      }
    },
  };
};

const chargeAuthorization = (apiUrl: string, secretKey: string) => {
  return {
    newPayment: async (
      email: string,
      amount: string,
      authCode: string,
      metadata?: TransactionsMetadata
    ): Promise<boolean> => {
      const endpoint = `${apiUrl}/transaction/charge_authorization`;
      const params = JSON.stringify({
        email,
        amount,
        channels: ['card'],
        authorization_code: authCode,
        metadata,
      });

      try {
        const response = await fetch(endpoint, {
          method: 'post',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
            'cache-control': 'no-cache',
          },
          body: params,
        });

        const payload = await response.json();

        const { status, message, data } = payload;
        if (!status) {
          throw new Error(message);
        }

        if (data.status === 'success') return true;

        throw new Error('Failed to charge card');
      } catch (err) {
        console.error(err);
        return false;
      }
    },
  };
};

const verifyTransaction = (apiUrl: string, secretKey: string) => {
  return {
    verifyPayment: async (ref: string) => {
      const endpoint = `${apiUrl}/transaction/verify/${ref}`;
      try {
        const response = await fetch(endpoint, {
          method: 'get',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'cache-control': 'no-cache',
          },
        });
        const payload = await response.json();
        const { status, message, data } = payload;
        if (!status) {
          console.error(message);
          return false;
        }
        const transactionStatus = data.status;
        if (transactionStatus === 'success') {
          saveTransaction(data);
          return true;
        }
        return false;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
  };
};

const verifyAccount = (apiUrl: string, secretKey: string) => {
  return {
    verifyAccountNumber: async (bankCode: string, acctNumber: string) => {
      try {
        const endpoint = `${apiUrl}/bank/resolve?account_number=${acctNumber}&bank_code=${bankCode}`;
        const response = await fetch(endpoint, {
          method: 'get',
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'cache-control': 'no-cache',
          },
        });
        const payload = await response.json();
        return payload;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
  };
};

const paystack = () => {
  const apiUrl = PAYSTACK_API;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  return {
    ...initializeTransaction(apiUrl, secretKey),
    ...verifyTransaction(apiUrl, secretKey),
    ...chargeAuthorization(apiUrl, secretKey),
    ...verifyAccount(apiUrl, secretKey),
  };
};

export default paystack;
