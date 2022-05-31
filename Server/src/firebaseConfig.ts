import { credential } from "firebase-admin";
import path from "path";
// import fs from "fs";
const serviceAccount = path.join(
  __dirname,
  "/../keys/urban-26725-firebase-adminsdk-sbxk1-96ac9b18f4.json"
);
const firebaseConfig = {
  credential: credential.cert(serviceAccount),
};

export default firebaseConfig;
