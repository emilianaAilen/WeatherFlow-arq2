import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Get all measurements' });
});

router.post('/', (req: Request, res: Response) => {
  res.status(201).json({ message: 'Create a new measurement' });
});

router.get('/:measurementId', (req: Request, res: Response) => {
  res.status(200).json({ message: `Get measurement ${req.params.measurementId}` });
});

router.patch('/:measurementId', (req: Request, res: Response) => {
  res.status(200).json({ message: `Update measurement ${req.params.measurementId}` });
});

router.delete('/:measurementId', (req: Request, res: Response) => {
  res.status(204).send();
});

export default router;
