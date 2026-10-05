import { Router } from 'express';
import { authenticate, getUid } from '../middleware/authenticate';
import { getOrCreateDirectConversation } from '../services/directConversations';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';
import { isRecord } from '../utils/parse';

export const conversationsRouter = Router();

conversationsRouter.post(
  '/direct',
  authenticate,
  asyncHandler(async (req, res) => {
    const body: unknown = req.body;
    if (!isRecord(body) || typeof body.otherUserId !== 'string' || body.otherUserId.length === 0) {
      throw new HttpError(400, 'INVALID_BODY', 'Informe otherUserId.');
    }
    const conversationId = await getOrCreateDirectConversation(getUid(res), body.otherUserId);
    res.status(200).json({ conversationId });
  }),
);
