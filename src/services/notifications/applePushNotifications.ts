import { existsSync, readFileSync } from 'fs';
import http2 from 'http2';
import jwt from 'jsonwebtoken';
import { join } from 'path';
import { v4 } from 'uuid';
import { APNS_DEVICE_ENDPOINT, APNS_DEV_URL, APNS_PROD_URL, APP_BUNDLE_NAME, __prod__ } from '../../constants';
export const sendPushKitNotification = (tokens: string[], reference: string, callerName: string) => {
  const pathToKey = join(__dirname, '../../../keys/AuthKey_3334434673.p8');
  const key = existsSync(pathToKey) ? readFileSync(pathToKey, 'utf8') : (process.env.APPLE_AUTH_KEY as string);
  const time = Math.round(new Date().getTime() / 1000);
  const token = jwt.sign(
    {
      iss: process.env.APPLE_TEAM_ID, //"team ID" of your developer account
      iat: time, //Replace with current unix epoch time [Not in milliseconds, frustated me :D]
    },
    key,
    {
      header: {
        alg: 'ES256',
        kid: process.env.APNS_KEY_ID, //issuer key which is "key ID" of your p8 file
      },
    }
  );

  const host = __prod__ ? APNS_PROD_URL : APNS_DEV_URL;

  tokens.forEach(async (x) => {
    try {
      const endPoint = `${APNS_DEVICE_ENDPOINT}${x}`;
      const uuid = v4();
      const client = http2.connect(host);

      client.on('error', (err) => console.error(err));
      const body = {
        aps: { alert: 'Urbn Call' },
        id: uuid,
        nameCaller: callerName,
        handle: reference,
        isVideo: true,
      };
      const headers = {
        ':method': 'POST',
        'apns-topic': `${APP_BUNDLE_NAME}.voip`, //your application bundle ID
        'apns-push-type': 'voip',
        'apns-priority': '10',
        'apns-expiration': '0',
        ':scheme': 'https',
        ':path': endPoint,
        authorization: `bearer ${token}`,
      };

      const request = client.request(headers);
      request.on('response', (headers) => {
        for (const name in headers) {
          console.log(`${name}: ${headers[name]}`);
        }
      });
      request.setEncoding('utf8');
      let data = '';
      request.on('data', (chunk) => {
        data += chunk;
      });
      request.write(JSON.stringify(body));
      request.on('end', () => {
        console.log(`\n${data}`);
        client.close();
      });
      request.end();
    } catch (err) {
      console.error(err);
    }
  });
};
