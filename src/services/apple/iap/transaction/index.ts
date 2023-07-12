import { AppStoreServerAPI, decodeTransaction, Environment } from 'app-store-server-api';
import { APP_BUNDLE_NAME, config, __prod__ } from 'constant';
import { readFileSync } from 'fs';
import { join } from 'path';

const pathToKey = join(config.APP_ROOT, '../keys/SubscriptionKey_MYN2N655KV.p8'); // For local development
console.log('App root: ', config.APP_ROOT);
console.log('path to key: ', pathToKey);
const key = process.env.APPLE_IN_APP_PURCHASE_API_KEY
  ? process.env.APPLE_IN_APP_PURCHASE_API_KEY
  : readFileSync(pathToKey, 'utf8');
const keyId = process.env.APPLE_IN_APP_PURCHASE_KEY_ID;
const issuerId = process.env.APP_STORE_CONNECT_ISSUER_ID;

async function getTransaction(transactionId: string) {
  let environment = __prod__ ? Environment.Production : Environment.Sandbox;
  let retryCount = 0;
  while (retryCount < 2) {
    const api = new AppStoreServerAPI(key, keyId, issuerId, APP_BUNDLE_NAME, environment);
    try {
      const response = await api.getTransactionInfo(transactionId);
      if (response.signedTransactionInfo) return await decodeTransaction(response.signedTransactionInfo);
    } catch (error) {
      console.error(error);
      environment = !__prod__ ? Environment.Production : Environment.Sandbox;
      retryCount += 1;
    }
  }
  return null;
}

export default getTransaction;
