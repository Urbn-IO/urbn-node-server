import crypto from 'crypto';

const createhashString = <T extends string | number | boolean>(data: T[], outputLength = 10) => {
  const date = new Date().toISOString() as T;
  data.push(date);

  const hashString = data.join('');

  const hash = crypto.createHash('shake256', { outputLength }).update(hashString).digest('hex');
  return hash;
};
export default createhashString;
