import { auth } from "firebase-admin";
import { OAuth } from "../../types";

export const getUserOAuth = async (uid: string) => {
  const userRecord = await auth().getUser(uid);
  if (!userRecord.emailVerified) return null;
  if (!userRecord.email || !userRecord.displayName) return null;
  const user: OAuth = {
    email: userRecord.email,
    displayName: userRecord.displayName,
  };
  return user;
};
