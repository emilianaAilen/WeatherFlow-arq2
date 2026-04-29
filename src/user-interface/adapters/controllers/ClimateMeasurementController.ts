import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ClimateMeasurementPort } from '@/user-interface/ports/ClimateMeasurementPort';
import { CreateMeasurementSchema } from '@/user-interface/dtos/CreateMeasurementDTO';
import { UpdateMeasurementSchema } from '@/user-interface/dtos/UpdateMeasurementDTO';

const UuidSchema = z.uuid();

export class ClimateMeasurementController {
  constructor(private readonly climateMeasurementService: ClimateMeasurementPort) {}

  async updateMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!UuidSchema.safeParse(id).success) {
        res.status(400).json({ message: 'Invalid id format — must be a UUID' });
        return;
      }
      const parsed = UpdateMeasurementSchema.safeParse(req.body);
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
      const measurement = await this.climateMeasurementService.updateMeasurement(id, parsed.data);
      res.status(200).json(measurement);
    } catch (error) {
      next(error);
    }
  }

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
