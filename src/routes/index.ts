import { Router } from 'express';

const router = Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.status(200).json({ status: 'OK' });
});

export { router };
