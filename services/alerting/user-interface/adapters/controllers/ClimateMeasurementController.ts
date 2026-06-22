import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { ClimateMeasurementPort } from '@/user-interface/ports/ClimateMeasurementPort';
import { CreateMeasurementSchema } from '@/user-interface/dtos/CreateMeasurementDTO';
import { UpdateMeasurementSchema } from '@/user-interface/dtos/UpdateMeasurementDTO';
import {
  MeasurementFilters,
  MeasurementFiltersQuerySchema,
} from '@/user-interface/dtos/MeasurementFiltersDTO';

const UuidSchema = z.uuid();

export class ClimateMeasurementController {
  constructor(private readonly climateMeasurementService: ClimateMeasurementPort) {}

  async deleteMeasurement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!UuidSchema.safeParse(id).success) {
        res.status(400).json({ message: 'Invalid id format — must be a UUID' });
        return;
      }
      await this.climateMeasurementService.deleteMeasurement(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getMeasurementById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!UuidSchema.safeParse(id).success) {
        res.status(400).json({ message: 'Invalid id format — must be a UUID' });
        return;
      }
      const measurement = await this.climateMeasurementService.getMeasurementById(id);
      if (!measurement) {
        res.status(404).json({ message: 'Climate measurement not found' });
        return;
      }
      res.status(200).json(measurement);
    } catch (error) {
      next(error);
    }
  }

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

  async getCurrentMeasurementByStation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { stationId } = req.params;
      if (!UuidSchema.safeParse(stationId).success) {
        res.status(400).json({ message: 'Invalid stationId format — must be a UUID' });
        return;
      }
      const measurement = await this.climateMeasurementService.getCurrentMeasurementByStationId(stationId);
      if (!measurement) {
        res.status(404).json({ message: 'No measurements found for this station' });
        return;
      }
      res.status(200).json(measurement);
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = MeasurementFiltersQuerySchema.safeParse(req.query);
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
      const filters: MeasurementFilters = {
        stationName: parsed.data.station,
        minTemperature: parsed.data.min_temperature,
        maxTemperature: parsed.data.max_temperature,
        minHumidity: parsed.data.min_humidity,
        maxHumidity: parsed.data.max_humidity,
        minPressure: parsed.data.min_pressure,
        maxPressure: parsed.data.max_pressure,
        isActiveAlert: parsed.data.alert_status,
      };
      const measurements = await this.climateMeasurementService.search(filters);
      res.status(200).json(measurements);
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
