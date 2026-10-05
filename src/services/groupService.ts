import { Unsubscribe, collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { apiRequest } from './apiClient';
import { db } from './firebase';
import { uploadImage } from './storageService';
import { ChatGroup, CreateGroupInput, UpdateGroupInput } from '../types/group';
import { isRecord, toGroup } from '../utils/parsers';

type CreateGroupResponse = { groupId: string };

export function observeGroups(
  uid: string,
  onData: (groups: ChatGroup[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', uid));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => toGroup(d.id, d.data()))), onError);
}

export function observeGroup(
  groupId: string,
  onData: (group: ChatGroup | null) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'groups', groupId),
    (snap) => {
      const data: unknown = snap.data();
      onData(snap.exists() && isRecord(data) ? toGroup(snap.id, data) : null);
    },
    onError,
  );
}

async function uploadGroupPhoto(photoUri: string): Promise<string> {
  return uploadImage(photoUri, 'chat/groupPhotos');
}

/**
 * A criação passa pela API: ela valida o limite e sincroniza o espelho de integrantes
 * no Realtime Database, de onde as regras de segurança das mensagens leem.
 */
export async function createGroup(ownerId: string, input: CreateGroupInput): Promise<string> {
  const photoUrl = input.photoUri ? await uploadGroupPhoto(input.photoUri) : '';
  const response = await apiRequest<CreateGroupResponse>('/groups', {
    method: 'POST',
    body: {
      name: input.name.trim(),
      photoUrl,
      memberLimit: input.memberLimit,
      notificationPolicy: input.notificationPolicy,
      memberIds: input.memberIds,
    },
  });
  return response.groupId;
}

/** Alterações (limite, política, integrantes...) aplicadas numa transação única no servidor. */
export async function updateGroup(groupId: string, ownerId: string, input: UpdateGroupInput): Promise<void> {
  const body: Record<string, unknown> = {};
  if (input.name !== undefined) body.name = input.name.trim();
  if (input.memberLimit !== undefined) body.memberLimit = input.memberLimit;
  if (input.notificationPolicy !== undefined) body.notificationPolicy = input.notificationPolicy;
  if (input.addMemberIds && input.addMemberIds.length > 0) body.addMemberIds = input.addMemberIds;
  if (input.removeMemberIds && input.removeMemberIds.length > 0) body.removeMemberIds = input.removeMemberIds;
  if (input.photoUri) body.photoUrl = await uploadGroupPhoto(input.photoUri);

  await apiRequest<unknown>(`/groups/${encodeURIComponent(groupId)}`, { method: 'PATCH', body });
}

export async function leaveGroup(groupId: string): Promise<void> {
  await apiRequest<null>(`/groups/${encodeURIComponent(groupId)}/leave`, { method: 'POST' });
}
