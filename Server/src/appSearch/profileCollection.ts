import { client } from "./client";

export const initializeSearch = async () => {
  const celebsSchema = {
    name: "celebrity",
    fields: [
      { name: "id", type: "string" },
      { name: "user_id", type: "string" },
      { name: "first_name", type: "string" },
      { name: "last_name", type: "string" },
      { name: "alias", type: "string" },
      { name: "thumbnail", type: "string" },
      { name: "image", type: "string" },
      { name: "image_thumbnail", type: "string" },
      { name: "image_placeholder", type: "string" },
      { name: "description", type: "string" },
      { name: "categories", type: "string[]", facet: true },
    ],
  };
  const collectionExists = await client.collections("celebrity").exists();
  if (!collectionExists) {
    client
      .collections()
      .create(celebsSchema as any)
      .then(
        (data) => {
          console.log("success creating collection");
          console.log(data);
        },
        (err) => {
          console.log("failure creating collection");
          console.log(err);
        }
      );
  }
};
