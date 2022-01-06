import { credential } from "firebase-admin";
import path from "path";
const serviceAccount = path.join(
  __dirname,
  "/../Keys/moment-fd215-firebase-adminsdk-dccgs-3cd2997a14.json"
);
console.log(serviceAccount);
export const firebaseConfig = {
  credential: credential.cert(serviceAccount),
};
