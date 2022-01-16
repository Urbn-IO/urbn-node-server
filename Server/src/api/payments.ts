import fetch from "node-fetch";

const secretKey = process.env.PAYSTACK_SECRET_KEY;

export const initializePayment = async (
  email: string,
  userId: string,
  amount: string
) => {
  const params = JSON.stringify({
    email,
    amount,
    channels: ["card"],
    metadata: { userId: userId, email: email },
  });
  try {
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "post",
        headers: {
          Authorization: "Bearer " + secretKey,
          "Content-Type": "application/json",
        },
        body: params,
      }
    );

    const payload = await response.json();

    const { status, message, data } = payload;
    if (!status) {
      return message;
    }

    // const accessCode = data.access_code;
    const authUrl = data.authorization_url;

    return authUrl;
  } catch (err) {
    return err;
  }
};

export const chargePayment = async (
  email: string,
  amount: string,
  authCode: string
) => {
  const params = JSON.stringify({
    email,
    amount,
    authorization_code: authCode,
  });
  try {
    const response = await fetch(
      "https://api.paystack.co/transaction/charge_authorization",
      {
        method: "post",
        headers: {
          Authorization: "Bearer " + secretKey,
          "Content-Type": "application/json",
        },
        body: params,
      }
    );

    const payload = await response.json();

    const { status } = payload;

    return status;
  } catch (err) {
    return err;
  }
};
