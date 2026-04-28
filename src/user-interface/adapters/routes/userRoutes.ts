import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Get all users' });
});

router.post('/', (req: Request, res: Response) => {
  res.status(201).json({ message: 'Create a new user' });
});

router.get('/:userId', (req: Request, res: Response) => {
  res.status(200).json({ message: `Get user ${req.params.userId}` });
});

router.patch('/:userId', (req: Request, res: Response) => {
  res.status(200).json({ message: `Update user ${req.params.userId}` });
});

router.delete('/:userId', (req: Request, res: Response) => {
  res.status(204).send();
});

export default router;
