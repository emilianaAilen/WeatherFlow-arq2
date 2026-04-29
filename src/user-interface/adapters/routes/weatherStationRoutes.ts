import { Router, Request, Response, NextFunction } from 'express';
import { weatherStationController } from '@/infrastructure/container';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Get all weather stations' });
});

router.post('/', (req: Request, res: Response, next: NextFunction) =>
  weatherStationController.createWeatherStation(req, res, next),
);

router.get('/:stationId', (req: Request, res: Response) => {
  res.status(200).json({ message: `Get weather station ${req.params.stationId}` });
});

router.patch('/:id', (req: Request, res: Response, next: NextFunction) =>
  weatherStationController.updateWeatherStation(req, res, next),
);

router.delete('/:stationId', (req: Request, res: Response) => {
  res.status(204).send();
});

export default router;
