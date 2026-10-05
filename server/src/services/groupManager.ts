import { firestore } from './firebaseAdmin';
import { syncConversationMembers, toGroupDoc } from './conversationLoader';
import { GroupDoc, NotificationPolicy } from '../types';
import { HttpError } from '../utils/httpError';
import { asStringArray, isNotificationPolicy, isRecord } from '../utils/parse';

export const MIN_MEMBERS = 2;
export const MAX_LIMIT = 50;

function requireName(value: unknown): string {
  if (typeof value !== 'string') throw new HttpError(400, 'INVALID_NAME', 'Informe o nome do grupo.');
  const name = value.trim();
  if (name.length < 3 || name.length > 40) {
    throw new HttpError(400, 'INVALID_NAME', 'O nome do grupo deve ter entre 3 e 40 caracteres.');
  }
  return name;
}

function requireLimit(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < MIN_MEMBERS || value > MAX_LIMIT) {
    throw new HttpError(
      400,
      'INVALID_LIMIT',
      `O limite deve ser um número inteiro entre ${MIN_MEMBERS} e ${MAX_LIMIT}.`,
    );
  }
  return value;
}

function requirePolicy(value: unknown): NotificationPolicy {
  if (!isNotificationPolicy(value)) {
    throw new HttpError(400, 'INVALID_POLICY', 'Política de notificação inválida.');
  }
  return value;
}

function requirePhoto(value: unknown): string {
  if (typeof value !== 'string') return '';
  if (value && !/^https:\/\//.test(value)) {
    throw new HttpError(400, 'INVALID_PHOTO', 'A foto deve ser uma URL HTTPS.');
  }
  return value;
}

function uniqueIds(values: unknown): string[] {
  return Array.from(new Set(asStringArray(values)));
}

async function assertUsersExist(ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  const refs = ids.map((id) => firestore.collection('userDirectory').doc(id));
  const snaps = await firestore.getAll(...refs);
  if (snaps.some((snap) => !snap.exists)) {
    throw new HttpError(400, 'USER_NOT_FOUND', 'Um dos usuários selecionados não existe.');
  }
}

export async function createGroup(ownerId: string, body: unknown): Promise<GroupDoc> {
  if (!isRecord(body)) throw new HttpError(400, 'INVALID_BODY', 'Corpo da requisição inválido.');

  const name = requireName(body.name);
  const memberLimit = requireLimit(body.memberLimit);
  const notificationPolicy = requirePolicy(body.notificationPolicy);
  const photoUrl = requirePhoto(body.photoUrl);
  const others = uniqueIds(body.memberIds).filter((id) => id !== ownerId);
  const memberIds = [ownerId, ...others];

  if (memberIds.length < MIN_MEMBERS) {
    throw new HttpError(400, 'TOO_FEW_MEMBERS', 'O grupo precisa ter ao menos 2 integrantes.');
  }
  if (memberIds.length > memberLimit) {
    throw new HttpError(409, 'GROUP_FULL', 'A quantidade de integrantes excede o limite do grupo.');
  }
  await assertUsersExist(others);

  const now = Date.now();
  const ref = firestore.collection('groups').doc();
  const data = {
    name,
    photoUrl,
    ownerId,
    memberIds,
    memberLimit,
    notificationPolicy,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(data);
  await syncConversationMembers(ref.id, memberIds);
  return toGroupDoc(ref.id, data);
}


export async function updateGroup(groupId: string, requesterId: string, body: unknown): Promise<GroupDoc> {
  if (!isRecord(body)) throw new HttpError(400, 'INVALID_BODY', 'Corpo da requisição inválido.');

  const ref = firestore.collection('groups').doc(groupId);
  const addIds = uniqueIds(body.addMemberIds);
  const removeIds = uniqueIds(body.removeMemberIds);

  const updated = await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, 'GROUP_NOT_FOUND', 'Grupo não encontrado.');
    const group = toGroupDoc(snap.id, snap.data() ?? {});

    if (group.ownerId !== requesterId) {
      throw new HttpError(403, 'FORBIDDEN', 'Somente o proprietário pode gerenciar o grupo.');
    }
    if (removeIds.includes(group.ownerId)) {
      throw new HttpError(400, 'OWNER_CANNOT_BE_REMOVED', 'O proprietário não pode ser removido.');
    }

    const name = body.name !== undefined ? requireName(body.name) : group.name;
    const photoUrl = body.photoUrl !== undefined ? requirePhoto(body.photoUrl) : group.photoUrl;
    const memberLimit = body.memberLimit !== undefined ? requireLimit(body.memberLimit) : group.memberLimit;
    const notificationPolicy =
      body.notificationPolicy !== undefined ? requirePolicy(body.notificationPolicy) : group.notificationPolicy;

    const toAdd = addIds.filter((id) => !group.memberIds.includes(id));
    const remaining = group.memberIds.filter((id) => !removeIds.includes(id));
    const memberIds = [...remaining, ...toAdd.filter((id) => !removeIds.includes(id))];

    if (memberIds.length < MIN_MEMBERS) {
      throw new HttpError(400, 'TOO_FEW_MEMBERS', 'O grupo precisa ter ao menos 2 integrantes.');
    }
    if (memberLimit < memberIds.length) {
      throw new HttpError(
        409,
        'LIMIT_BELOW_MEMBERS',
        'O limite não pode ser menor que a quantidade de integrantes.',
      );
    }
    if (memberIds.length > memberLimit) {
      throw new HttpError(409, 'GROUP_FULL', 'O grupo não tem vagas suficientes.');
    }

    if (toAdd.length > 0) {
      const refs = toAdd.map((id) => firestore.collection('userDirectory').doc(id));
      const found = await tx.getAll(...refs);
      if (found.some((item) => !item.exists)) {
        throw new HttpError(400, 'USER_NOT_FOUND', 'Um dos usuários selecionados não existe.');
      }
    }

    const changes = { name, photoUrl, memberLimit, notificationPolicy, memberIds, updatedAt: Date.now() };
    tx.update(ref, changes);
    return { ...group, ...changes };
  });

  await syncConversationMembers(groupId, updated.memberIds);
  return updated;
}

export async function leaveGroup(groupId: string, uid: string): Promise<void> {
  const ref = firestore.collection('groups').doc(groupId);
  const memberIds = await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, 'GROUP_NOT_FOUND', 'Grupo não encontrado.');
    const group = toGroupDoc(snap.id, snap.data() ?? {});
    if (!group.memberIds.includes(uid)) {
      throw new HttpError(403, 'FORBIDDEN', 'Você não é integrante deste grupo.');
    }
    if (group.ownerId === uid) {
      throw new HttpError(400, 'OWNER_CANNOT_LEAVE', 'O proprietário não pode sair do próprio grupo.');
    }
    const next = group.memberIds.filter((id) => id !== uid);
    if (next.length < MIN_MEMBERS) {
      throw new HttpError(400, 'TOO_FEW_MEMBERS', 'O grupo precisa ter ao menos 2 integrantes.');
    }
    tx.update(ref, { memberIds: next, updatedAt: Date.now() });
    return next;
  });
  await syncConversationMembers(groupId, memberIds);
}
