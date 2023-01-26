import { credential } from 'firebase-admin';
import { existsSync } from 'fs';
import path from 'path';
// import fs from "fs";
const filePath = path.join(__dirname, '/../keys/urbn-d9bee-firebase-adminsdk-4bbpt-94f94a82b6.json');
const serviceAccount = existsSync(filePath) ? filePath : JSON.parse(process.env.FIREBASE_CONFIG as string);
const firebaseConfig = {
  credential: credential.cert(serviceAccount),
};

export default firebaseConfig;
