import express from 'express';
const router = express.Router();

router.get('/', (req, _) => {
  const payload = req.body;
  console.log(payload);
});
