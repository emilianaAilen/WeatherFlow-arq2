import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Get all weather stations' });
});

router.post('/', (req: Request, res: Response) => {
  res.status(201).json({ message: 'Create a new weather station' });
});

router.get('/:stationId', (req: Request, res: Response) => {
  res.status(200).json({ message: `Get weather station ${req.params.stationId}` });
});

router.patch('/:stationId', (req: Request, res: Response) => {
  res.status(200).json({ message: `Update weather station ${req.params.stationId}` });
});

router.delete('/:stationId', (req: Request, res: Response) => {
  res.status(204).send();
});

export default router;
