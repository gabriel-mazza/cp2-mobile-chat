import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { conversationsRouter } from './routes/conversations';
import { groupsRouter } from './routes/groups';
import { notificationsRouter } from './routes/notifications';
import { usersRouter } from './routes/users';
import { HttpError } from './utils/httpError';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '50kb' }));

// Health check (usado pela hospedagem e para verificar disponibilidade)
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'chat-firebase-api', time: new Date().toISOString() });
});

app.use('/notifications', notificationsRouter);
app.use('/groups', groupsRouter);
app.use('/conversations', conversationsRouter);
app.use('/users', usersRouter);

app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new HttpError(404, 'NOT_FOUND', 'Rota não encontrada.'));
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  console.error('Erro inesperado:', error instanceof Error ? error.message : 'desconhecido');
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Erro interno. Tente novamente.' } });
});
