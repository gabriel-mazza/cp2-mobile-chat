import { Router } from 'express';
import { authenticate, getUid } from '../middleware/authenticate';
import { createGroup, leaveGroup, updateGroup } from '../services/groupManager';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';

const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

function readGroupId(value: unknown): string {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    throw new HttpError(400, 'INVALID_ID', 'Identificador de grupo inválido.');
  }
  return value;
}

export const groupsRouter = Router();

groupsRouter.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const group = await createGroup(getUid(res), req.body);
    res.status(201).json({ groupId: group.id, group });
  }),
);

groupsRouter.patch(
  '/:groupId',
  authenticate,
  asyncHandler(async (req, res) => {
    const group = await updateGroup(readGroupId(req.params.groupId), getUid(res), req.body);
    res.status(200).json({ group });
  }),
);

groupsRouter.post(
  '/:groupId/leave',
  authenticate,
  asyncHandler(async (req, res) => {
    await leaveGroup(readGroupId(req.params.groupId), getUid(res));
    res.status(204).end();
  }),
);
