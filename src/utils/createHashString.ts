import crypto from "crypto";

const createhashString = <T extends string | number | boolean>(data: T[]) => {
  const date = new Date().toISOString() as T;
  data.push(date);

  const hashString = data.join("");

  const hash = crypto.createHash("shake256", { outputLength: 10 }).update(hashString).digest("hex");
  return hash;
};
export default createhashString;
