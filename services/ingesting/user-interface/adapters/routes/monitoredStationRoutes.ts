import { Router } from 'express';
import { monitoredStationController } from '@/infrastructure/container';

export const monitoredStationRoutes = Router();

monitoredStationRoutes.get('/', (req, res, next) =>
  monitoredStationController.getAll(req, res, next),
);

monitoredStationRoutes.get('/:id', (req, res, next) =>
  monitoredStationController.getById(req, res, next),
);
