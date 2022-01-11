import fetch from "node-fetch";

const secretKey = process.env.PAYSTACK_SECRET_KEY;

export const initializePayment = async (
  email: string,
  amount: string,
  curreny: string
) => {
  const params = JSON.stringify({
    email,
    amount,
    curreny,
    channels: ["card"],
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
    console.log("status obj: ", status);
    console.log("message obj: ", message);
    console.log("data obj: ", data);

    // const accessCode = data.access_code;
    const authUrl = data.authorization_url;

    return authUrl;
  } catch (err) {
    return err;
  }
};

export const chargePayment = async () => {
  const params = JSON.stringify({
    email: "customer@email.com",
    amount: "10000000",
    authorization_code: "AUTH_pmx3mgawyd",
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

    const { status, message, data } = payload;
    console.log("status obj: ", status);
    console.log("message obj: ", message);
    console.log("data obj: ", data);

    return data;
  } catch (err) {
    return err;
  }
};
