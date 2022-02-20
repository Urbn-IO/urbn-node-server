import { User } from "../entities/User";
import { client } from "./client";

export const upsertSearchItem = async (user: User | undefined) => {
  if (user?.celebrity) {
    const celebObj = {
      id: user.celebrity.id.toString(),
      user_id: user.userId,
      first_name: user.firstName,
      last_name: user.lastName,
      alias: user.celebrity.alias,
      profile_thumbnail: user.celebrity.profileThumbnail,
      profile_object: user.celebrity.profileObject,
      description: user.celebrity.description,
      // categories: user.celebrity.categories
    };
    try {
      const result = await client
        .collections("celebrity")
        .documents()
        .upsert(celebObj);
      console.log(result);
    } catch (err) {
      console.log("typesense error: ", err);
    }
  }
};
