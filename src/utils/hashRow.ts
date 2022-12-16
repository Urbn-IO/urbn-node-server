import crypto from 'crypto';
import { OnboardCelebrityInputs, UpdateCelebrityInputs } from './graphqlTypes';

export const hashRow = (data: OnboardCelebrityInputs | UpdateCelebrityInputs) => {
  let hashString = '';
  const values = Object.values(data);
  for (const val of values) {
    hashString += val;
  }

  const hash = crypto.createHash('md5').update(hashString).digest('hex');
  return hash;
};
