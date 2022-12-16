import { client } from './client';

export const initializeSearch = async () => {
  const celebsSchema = {
    name: 'celebrity',
    fields: [
      { name: 'id', type: 'string' },
      { name: 'alias', type: 'string' },
      { name: 'thumbnail', type: 'string' },
      { name: 'video_banner', type: 'string' },
      { name: 'placeholder', type: 'string' },
      { name: 'low_res_placeholder', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'profile_hash', type: 'string' },
      { name: 'categories', type: 'string[]', facet: true },
    ],
  };
  const categorySchema = {
    name: 'category',
    fields: [
      { name: 'category_id', type: 'int32' },
      { name: 'category_name', type: 'string' },
    ],
  };
  const celebrityCollectionExists = await client.collections('celebrity').exists();
  const categoryCollectionExists = await client.collections('category').exists();
  if (!celebrityCollectionExists) {
    client
      .collections()
      .create(celebsSchema as any)
      .then(
        (data) => {
          console.log('success creating collection');
          console.log(data);
        },
        (err) => {
          console.log('failure creating collection');
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
          console.log('success creating collection');
          console.log(data);
        },
        (err) => {
          console.log('failure creating collection');
          console.log(err);
        }
      );
  }
};
