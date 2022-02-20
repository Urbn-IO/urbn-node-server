import express from "express";
import { client } from "../appSearch/client";

const searchRouter = express.Router();

searchRouter.get("/search", async (req, res) => {
  const { q } = req.query;

  const searchParameters = {
    q: q as string,
    query_by: "first_name, last_name, alias, description",
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

searchRouter.post("/add", async (req, res) => {
  const celebs = req.body;
  try {
    const result = await client
      .collections("celebrity")
      .documents()
      .import(celebs);
    res.send(result);
  } catch (err) {
    res.send(err);
  }
});

export default searchRouter;
