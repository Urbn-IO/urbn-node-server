import { messaging } from "firebase-admin";

export const firebaseCM = (
  messageTitle: string,
  messageBody: string,
  tokens: string[]
) => {
  //   const registrationTokens = [
  //     "YOUR_REGISTRATION_TOKEN_1",
  //     // …
  //     "YOUR_REGISTRATION_TOKEN_N",
  //   ];
  const registrationTokens = tokens as unknown as string[];

  const message = {
    notification: { title: messageTitle, body: messageBody },
    tokens: registrationTokens,
  };

  messaging()
    .sendMulticast(message)
    .then((response) => {
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(registrationTokens[idx]);
          }
        });
        console.log("List of tokens that caused failures: " + failedTokens);
      }
    });
};
