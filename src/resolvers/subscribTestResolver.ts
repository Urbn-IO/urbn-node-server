import { Arg, Mutation, Publisher, PubSub, Resolver, Root, Subscription, ResolverFilterData } from "type-graphql";
import { SubscriptionTopics } from "../types";

import { Person, PersonInput, SubPayload } from "../utils/graphqlTypes";

// enum SubEvent {
//   newPerson = "newPerson",
// }

@Resolver()
export class SubscriptionTestResolver {
  allPeople: Person[] = [];
  @Mutation(() => Person)
  addPerson(@Arg("person") person: PersonInput, @PubSub(SubscriptionTopics.TEST_TOPIC) publish: Publisher<SubPayload>) {
    this.allPeople.push(person);
    publish({ newPerson: person, userId: "571da0fc-8ec6-44d1-8d1f-f734173b230a" });
    return person;
  }

  @Subscription({
    topics: SubscriptionTopics.TEST_TOPIC,
    filter: ({ payload, context }: ResolverFilterData<SubPayload, any, any>) => {
      return context.userId === payload.userId;
    },
  })
  newPerson(@Root() subPayload: SubPayload): Person {
    console.log("dcjdnj");
    return {
      name: subPayload.newPerson.name,
      age: subPayload.newPerson.age,
      gender: subPayload.newPerson.gender,
    };
  }
}
