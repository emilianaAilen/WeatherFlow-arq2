import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { WeatherStationPort } from '@/user-interface/ports/WeatherStationPort';
import { CreateWeatherStationSchema } from '@/user-interface/dtos/CreateWeatherStationDTO';
import { UpdateWeatherStationSchema } from '@/user-interface/dtos/UpdateWeatherStationDTO';

const UuidSchema = z.uuid();

export class WeatherStationController {
  constructor(private readonly weatherStationService: WeatherStationPort) {}

  async updateWeatherStation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!UuidSchema.safeParse(id).success) {
        res.status(400).json({ message: 'Invalid id format — must be a UUID' });
        return;
      }
      const parsed = UpdateWeatherStationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }
      const station = await this.weatherStationService.updateWeatherStation(id, parsed.data);
      res.status(200).json(station);
    } catch (error) {
      next(error);
    }
  }

  async createWeatherStation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = CreateWeatherStationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          message: 'Validation failed',
          errors: parsed.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
        return;
      }
      const station = await this.weatherStationService.createWeatherStation(parsed.data);
      res.status(201).json(station);
    } catch (error) {
      next(error);
    }
  }
}
