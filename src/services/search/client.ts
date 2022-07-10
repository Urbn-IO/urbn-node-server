import { Client } from "typesense";

export const client = new Client({
  apiKey: process.env.TYPESENSE_API_KEY,
  nodes: [
    {
      host: process.env.TYPESENSE_NODE_CLUSTER,
      port: 443,
      protocol: "https",
    },
  ],
  connectionTimeoutSeconds: 10,
});
