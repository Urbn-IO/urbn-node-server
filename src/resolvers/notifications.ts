import { Authorized, Ctx, Mutation } from 'type-graphql';
import { sendInstantNotification } from '../services/notifications/handler';
import { AppContext } from '../types';

export class NotificationResolver {
  @Mutation(() => Boolean)
  @Authorized()
  async sendPushNotification(@Ctx() { req }: AppContext) {
    const userId = req.session.userId as string;
    await sendInstantNotification([userId], 'Test Message', 'Body of test message');
    return true;
  }
}
