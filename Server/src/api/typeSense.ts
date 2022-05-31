import express from "express";
import { client } from "../services/appSearch/client";

const searchRouter = express.Router();

searchRouter.get("/getCollection", async (req, res) => {
  const { q } = req.query;
  try {
    const result = await client.collections(q as string).retrieve();
    res.send(result);
  } catch (err) {
    res.send(err);
  }
});

searchRouter.get("/getAllCollections", async (_, res) => {
  try {
    const result = await client.collections().retrieve();
    res.send(result);
  } catch (err) {
    res.send(err);
  }
});

searchRouter.get("/dropCollection", async (req, res) => {
  const { q } = req.query;
  try {
    const result = await client.collections(q as string).delete();
    res.send(result);
  } catch (err) {
    res.send(err);
  }
});

searchRouter.get("/searchCelebrity", async (req, res) => {
  const { q } = req.query;

  const searchParameters = {
    q: q as string,
    query_by: "first_name, last_name, alias, description, categories",
  };

  try {
    const result = await client
      .collections("celebrity")
      .documents()
      .search(searchParameters);
    res.send(result);
  } catch (err) {
    res.send(err);
  }
});

searchRouter.post("/addCelebrity", async (req, res) => {
  const celebs = req.body;
  try {
    const result = await client
      .collections("celebrity")
      .documents()
      .import(celebs, { action: "upsert" });
    res.send(result);
  } catch (err) {
    res.send(err);
  }
});

searchRouter.post("/addCategory", async (req, res) => {
  const category = req.body.data;
  try {
    const result = await client
      .collections("category")
      .documents()
      .import(category, { action: "upsert" });
    res.send(result);
  } catch (err) {
    res.send(err);
  }
});

export default searchRouter;
