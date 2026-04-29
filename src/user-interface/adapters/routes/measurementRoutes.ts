import { Router, Request, Response, NextFunction } from 'express';
import { measurementController } from '@/infrastructure/container';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Get all measurements' });
});

router.post('/', (req: Request, res: Response, next: NextFunction) =>
  measurementController.createMeasurement(req, res, next),
);

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
