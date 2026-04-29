import { Router, Request, Response, NextFunction } from 'express';
import { userController } from '@/infrastructure/container';

const router = Router();

router.post('/', (req: Request, res: Response, next: NextFunction) =>
  userController.createUser(req, res, next),
);

router.get('/', (req: Request, res: Response, next: NextFunction) =>
  userController.getAllUsers(req, res, next),
);

router.get('/:id', (req: Request, res: Response, next: NextFunction) =>
  userController.getUserById(req, res, next),
);

router.patch('/:userId', (req: Request, res: Response) => {
  res.status(200).json({ message: `Update user ${req.params.userId}` });
});

router.delete('/:userId', (_req: Request, res: Response) => {
  res.status(204).send();
});

export default router;
