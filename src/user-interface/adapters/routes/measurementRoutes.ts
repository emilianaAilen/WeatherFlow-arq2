import { Router, Request, Response, NextFunction } from 'express';
import { measurementController } from '@/infrastructure/container';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Get all measurements' });
});

router.post('/', (req: Request, res: Response, next: NextFunction) =>
  measurementController.createMeasurement(req, res, next),
);

router.get('/:id', (req: Request, res: Response, next: NextFunction) =>
  measurementController.getMeasurementById(req, res, next),
);

router.patch('/:id', (req: Request, res: Response, next: NextFunction) =>
  measurementController.updateMeasurement(req, res, next),
);

router.delete('/:id', (req: Request, res: Response, next: NextFunction) =>
  measurementController.deleteMeasurement(req, res, next),
);

export default router;
