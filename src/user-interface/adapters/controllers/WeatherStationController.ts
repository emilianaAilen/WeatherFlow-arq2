import { NextFunction, Request, Response } from 'express';
import { WeatherStationPort } from '@/user-interface/ports/WeatherStationPort';
import { CreateWeatherStationSchema } from '@/user-interface/dtos/CreateWeatherStationDTO';

export class WeatherStationController {
  constructor(private readonly weatherStationService: WeatherStationPort) {}

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
