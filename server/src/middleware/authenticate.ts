import { NextFunction, Request, Response } from 'express';
import { adminAuth } from '../services/firebaseAdmin';
import { HttpError } from '../utils/httpError';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.header('Authorization') ?? '';
    const match = /^Bearer (.+)$/.exec(header);
    if (!match || !match[1]) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'Token de autenticação ausente.');
    }
    const decoded = await adminAuth.verifyIdToken(match[1]);
    res.locals.uid = decoded.uid;
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }
    next(new HttpError(401, 'INVALID_TOKEN', 'Sessão inválida ou expirada. Faça login novamente.'));
  }
}

export function getUid(res: Response): string {
  const uid: unknown = res.locals.uid;
  if (typeof uid !== 'string' || uid.length === 0) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Usuário não autenticado.');
  }
  return uid;
}
