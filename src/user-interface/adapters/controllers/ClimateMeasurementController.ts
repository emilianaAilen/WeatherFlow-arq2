import { NextFunction, Request, Response } from 'express';
import { ClimateMeasurementPort } from '@/user-interface/ports/ClimateMeasurementPort';
import { CreateMeasurementSchema } from '@/user-interface/dtos/CreateMeasurementDTO';

export class ClimateMeasurementController {
  constructor(private readonly climateMeasurementService: ClimateMeasurementPort) {}

  async createMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = CreateMeasurementSchema.safeParse(req.body);
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
      const measurement = await this.climateMeasurementService.createMeasurement(parsed.data);
      res.status(201).json(measurement);
    } catch (error) {
      next(error);
    }
  }
}
