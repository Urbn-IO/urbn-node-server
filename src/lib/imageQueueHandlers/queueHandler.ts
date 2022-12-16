import { sendInstantNotification } from '../../services/notifications/handler';
import { ImageProcessorQueueOutput, NotificationPriority, NotificationRouteCode } from '../../types';
import storeImages from './storeImages';

const handler = async (data: ImageProcessorQueueOutput[]) => {
  const failedUserIds = data
    .filter((x) => x.status === 'failed')
    .map((x) => x.userId)
    .filter((x) => x !== null) as string[];

  const successList = data.filter((x) => x.status === 'success');

  if (failedUserIds.length > 0) {
    await sendInstantNotification(
      failedUserIds,
      'Failed upload alert 🚨',
      'One or more images you uploaded encountered an error during processing, re-upload your images or try again with other images ',
      NotificationRouteCode.RESPONSE,
      NotificationPriority.HIGH
    );
  }

  if (successList.length > 0) await storeImages(successList);
};

export default handler;
