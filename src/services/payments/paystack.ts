import { TransactionsMetadata } from "../../types";
import { saveCardPaystack } from "./saveCard";
import { saveTransaction } from "./transactions";

const initializeTransaction = (apiUrl: string, secretKey: string) => {
  return {
    initializePayment: async (email: string, userId: string, amount: string) => {
      const endpoint = `${apiUrl}/transaction/initialize`;
      const params = JSON.stringify({
        email,
        amount,
        channels: ["card"],
        metadata: { userId: userId, email: email },
      });
      try {
        const response = await fetch(endpoint, {
          method: "post",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: params,
        });

        const payload = await response.json();

        const { status, message, data } = payload;
        if (!status) {
          console.error(message);
          return status;
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
      reference: string,
      metadata?: TransactionsMetadata
    ) => {
      const endpoint = `${apiUrl}/transaction/charge_authorization`;
      const params = JSON.stringify({
        email,
        amount,
        reference,
        channels: ["card"],
        authorization_code: authCode,
        metadata,
      });
      try {
        const response = await fetch(endpoint, {
          method: "post",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          body: params,
        });

        const payload = await response.json();

        const { status } = payload;

        return status;
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
          method: "get",
          headers: {
            Authorization: `Bearer ${secretKey}`,
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
        if (transactionStatus === "success") {
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
