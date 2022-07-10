import crypto from "crypto";

const createhashString = (data: any[]) => {
  const date = new Date().toISOString();
  data.push(date);

  const hashString = data.join("");

  const hash = crypto.createHash("sha256").update(hashString).digest("hex");
  return hash;
};
export default createhashString;
