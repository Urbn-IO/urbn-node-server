import { credential } from "firebase-admin";
import path from "path";
// import fs from "fs";
const serviceAccount = path.join(
  __dirname,
  "/../keys/urbn-d9bee-firebase-adminsdk-4bbpt-94f94a82b6.json"
);
const firebaseConfig = {
  credential: credential.cert(serviceAccount),
};

export default firebaseConfig;
