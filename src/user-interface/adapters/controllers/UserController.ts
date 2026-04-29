import { NextFunction, Request, Response } from 'express';
import { UserPort } from '@/user-interface/ports/UserPort';
import { CreateUserSchema } from '@/user-interface/dtos/CreateUserDTO';

export class UserController {
  constructor(private readonly userService: UserPort) {}

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
