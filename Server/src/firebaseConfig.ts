import { credential } from "firebase-admin";
import path from "path";
// import fs from "fs";
const serviceAccount = path.join(
  __dirname,
  "/../keys/moment-fd215-firebase-adminsdk-dccgs-3cd2997a14.json"
);
export const firebaseConfig = {
  credential: credential.cert(serviceAccount),
};
