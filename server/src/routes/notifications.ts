import { Router } from 'express';
import { authenticate, getUid } from '../middleware/authenticate';
import { dispatchMessageNotification } from '../services/notificationDispatcher';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { isRecord } from '../utils/parse';

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export const notificationsRouter = Router();

notificationsRouter.post(
  '/messages',
  authenticate,
  asyncHandler(async (req, res) => {
    const body: unknown = req.body;
    if (!isRecord(body)) throw new HttpError(400, 'INVALID_BODY', 'Corpo da requisição inválido.');
    const { conversationId, messageId } = body;
    if (
      typeof conversationId !== 'string' ||
      typeof messageId !== 'string' ||
      !ID_PATTERN.test(conversationId) ||
      !ID_PATTERN.test(messageId)
    ) {
      throw new HttpError(400, 'INVALID_IDS', 'conversationId e messageId são obrigatórios.');
    }
    const result = await dispatchMessageNotification(getUid(res), conversationId, messageId);
    res.status(200).json(result);
  }),
);
