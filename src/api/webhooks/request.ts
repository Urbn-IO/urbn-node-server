import express from 'express';
import { Requests } from 'entities/Requests';
import { RequestStatus } from 'types';
const router = express.Router();

router.post('/', async (req, res) => {
  const reference = req.headers.reference as string;
  res.sendStatus(200);
  await Requests.update({ reference }, { status: RequestStatus.PROCESSING });
  console.log(`webhook hit, changing request with reference: ${reference} to processing`);
});

export default router;
