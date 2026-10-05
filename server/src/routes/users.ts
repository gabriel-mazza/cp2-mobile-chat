import { Router } from 'express';
import { authenticate, getUid } from '../middleware/authenticate';
import { loadSharedProfile, shareConversation } from '../services/profileAccess';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export const usersRouter = Router();

// Perfil só é entregue se os dois usuários compartilham uma conversa individual ou um grupo.
usersRouter.get(
  '/:uid/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const target = req.params.uid;
    if (typeof target !== 'string' || !ID_PATTERN.test(target)) {
      throw new HttpError(400, 'INVALID_ID', 'Identificador inválido.');
    }
    const requester = getUid(res);
    if (!(await shareConversation(requester, target))) {
      throw new HttpError(403, 'FORBIDDEN', 'Você não compartilha conversa ou grupo com este usuário.');
    }
    const profile = await loadSharedProfile(target);
    if (!profile) throw new HttpError(404, 'USER_NOT_FOUND', 'Usuário não encontrado.');
    res.status(200).json({ profile });
  }),
);
