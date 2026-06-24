import { Router, Request, Response, NextFunction } from 'express';
import { measurementController } from '@/infrastructure/container';

const router = Router();

router.get('/:id/temperature/average/week', (req: Request, res: Response, next: NextFunction) =>
  measurementController.getWeeklyTemperatureAverageByStation(req, res, next),
);

export default router;
