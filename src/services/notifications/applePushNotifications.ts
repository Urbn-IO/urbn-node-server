import { Notification, Provider, ProviderOptions } from '@parse/node-apn';
import { APP_BUNDLE_NAME, __prod__ } from 'constant';
import { readFileSync } from 'fs';
import { join } from 'path';
import { v4 } from 'uuid';

const pathToKey = join(__dirname, '../../../keys/AuthKey_3334434673.p8');
const key = process.env.APPLE_AUTH_KEY ? process.env.APPLE_AUTH_KEY : readFileSync(pathToKey, 'utf8');
const keyId = process.env.APNS_KEY_ID;
const teamId = process.env.APPLE_TEAM_ID;

export function sendPushKitNotification(tokens: string[], reference: string, callerName: string) {
  const options: ProviderOptions = {
    token: {
      key,
      keyId,
      teamId,
    },
    production: __prod__,
  };

  if (!options.token) return;
  if (options.token.key.length <= 0 || options.token.keyId.length <= 0 || options.token.teamId.length <= 0) {
    return;
  }

  const apnProvider = new Provider(options);
  const id = v4();

  const notification = new Notification();

  notification.id = id;
  notification.priority = 10;
  notification.expiry = 0;
  notification.alert = 'Urbn Call';
  notification.payload = {
    id,
    nameCaller: callerName,
    handle: reference,
    isVideo: true,
  };
  notification.topic = `${APP_BUNDLE_NAME}.voip`;
  notification.pushType = 'voip';

  apnProvider.send(notification, tokens).then((result) => {
    // see documentation for an explanation of result
    if (result.sent) {
      console.info('✔ push notification sent');
    } else {
      console.error("✖ couldn't send push notification", result.failed);
    }
    apnProvider.shutdown();
  });
}
