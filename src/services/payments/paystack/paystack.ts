import { TransactionsMetadata } from '../../../types';
import { saveCardPaystack } from '../saveCard';
import { saveTransaction } from '../transactions';

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

        // const accessCode = data.access_code;
        const authUrl = data.authorization_url;
        const ref = data.reference;

        return { authUrl, ref };
      } catch (err) {
        console.error(err);
        return false;
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
    verifyPayment: async (ref: string, newCard?: boolean) => {
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
        console.log(data);
        if (!status) {
          console.error(message);
          return false;
        }
        const transactionStatus = data.status;
        if (transactionStatus === 'success') {
          if (newCard) {
            saveCardPaystack(data);
          }
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

const paystack = () => {
  const apiUrl = process.env.PAYSTACK_API;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  return {
    ...initializeTransaction(apiUrl, secretKey),
    ...verifyTransaction(apiUrl, secretKey),
    ...chargeAuthorization(apiUrl, secretKey),
  };
};

export default paystack;
