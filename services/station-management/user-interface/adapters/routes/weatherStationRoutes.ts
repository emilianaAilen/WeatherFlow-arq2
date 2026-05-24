import { Router, Request, Response, NextFunction } from 'express';
import { weatherStationController } from '@/infrastructure/container';

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) =>
  weatherStationController.getAllStations(req, res, next),
);

router.post('/', (req: Request, res: Response, next: NextFunction) =>
  weatherStationController.createWeatherStation(req, res, next),
);

router.get('/:id', (req: Request, res: Response, next: NextFunction) =>
  weatherStationController.getStationById(req, res, next),
);

router.patch('/:id', (req: Request, res: Response, next: NextFunction) =>
  weatherStationController.updateWeatherStation(req, res, next),
);

router.delete('/:id', (req: Request, res: Response, next: NextFunction) =>
  weatherStationController.deleteStation(req, res, next),
);

export default router;
