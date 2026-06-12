import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { MonitoredStationPort } from '@/user-interface/ports/MonitoredStationPort';

const UuidSchema = z.uuid();

export class MonitoredStationController {
  constructor(private readonly monitoredStationService: MonitoredStationPort) {}

  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stations = await this.monitoredStationService.getAll();
      res.status(200).json(stations);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!UuidSchema.safeParse(id).success) {
        res.status(400).json({ message: 'Invalid id format — must be a UUID' });
        return;
      }
      const station = await this.monitoredStationService.getById(id);
      res.status(200).json(station);
    } catch (error) {
      next(error);
    }
  }
}
