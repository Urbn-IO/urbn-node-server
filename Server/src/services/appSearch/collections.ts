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
      { name: "image_placeholder", type: "string" },
      { name: "image_thumbnail", type: "string" },
      { name: "image", type: "string" },
      { name: "description", type: "string" },
      { name: "profile_hash", type: "string" },
      { name: "categories", type: "string[]", facet: true },
    ],
  };
  const categorySchema = {
    name: "category",
    fields: [
      { name: "category_id", type: "int32" },
      { name: "category_name", type: "string" },
    ],
  };
  const celebrityCollectionExists = await client
    .collections("celebrity")
    .exists();
  const categoryCollectionExists = await client
    .collections("category")
    .exists();
  if (!celebrityCollectionExists) {
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
  if (!categoryCollectionExists) {
    client
      .collections()
      .create(categorySchema as any)
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
