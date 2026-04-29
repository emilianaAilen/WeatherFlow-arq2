import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { UserPort } from '@/user-interface/ports/UserPort';
import { CreateUserSchema } from '@/user-interface/dtos/CreateUserDTO';
import { UpdateUserSchema } from '@/user-interface/dtos/UpdateUserDTO';

const UuidSchema = z.uuid();

export class UserController {
  constructor(private readonly userService: UserPort) {}

  async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!UuidSchema.safeParse(id).success) {
        res.status(400).json({ message: 'Invalid id format — must be a UUID' });
        return;
      }
      const user = await this.userService.getUserById(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (!UuidSchema.safeParse(id).success) {
        res.status(400).json({ message: 'Invalid id format — must be a UUID' });
        return;
      }
      const parsed = UpdateUserSchema.safeParse(req.body);
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
      const user = await this.userService.updateUser(id, parsed.data);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = CreateUserSchema.safeParse(req.body);
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
      const user = await this.userService.createUser(parsed.data);
      res.status(201).json({
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
      });
    } catch (error) {
      next(error);
    }
  }
}
