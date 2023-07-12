import crypto from 'crypto';
import { CelebrityDataInputs } from './graphqlTypes';

export const hashRow = (data: CelebrityDataInputs | Partial<CelebrityDataInputs>) => {
  let hashString = '';
  const values = Object.values(data);
  for (const val of values) {
    hashString += val;
  }

  const hash = crypto.createHash('md5').update(hashString).digest('hex');
  return hash;
};
