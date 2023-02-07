import pubsub from 'pubsub';
import { SubscriptionTopics } from 'types';

const publish = <T>(topic: SubscriptionTopics, payload: T) => {
  pubsub.publish(topic, payload);
};
export default publish;
