export const __prod__ = process.env.Node_ENV === "production";
export const dbConfig = {
  dbName: "urbn",
  user: "urbn",
  password: "12345678",
};

export const COOKIE_NAME = "urban:auth";
export const FORGET_PASSWORD_PREFIX = "forget-password:";
