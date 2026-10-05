import { firestore, realtimeDb } from './firebaseAdmin';
import { ConversationInfo, GroupDoc, StoredMessage } from '../types';
import {
  asNumber,
  asString,
  asStringArray,
  isNotificationPolicy,
  isRecord,
  parseStoredMessage,
} from '../utils/parse';

export function toGroupDoc(id: string, data: Record<string, unknown>): GroupDoc {
  const policy = data.notificationPolicy;
  return {
    id,
    name: asString(data.name),
    photoUrl: asString(data.photoUrl),
    ownerId: asString(data.ownerId),
    memberIds: asStringArray(data.memberIds),
    memberLimit: asNumber(data.memberLimit, 0),
    notificationPolicy: isNotificationPolicy(policy) ? policy : 'all_group_messages',
    createdAt: asNumber(data.createdAt),
    updatedAt: asNumber(data.updatedAt),
  };
}

export async function loadConversation(conversationId: string): Promise<ConversationInfo | null> {
  const [groupSnap, directSnap] = await Promise.all([
    firestore.collection('groups').doc(conversationId).get(),
    firestore.collection('directConversations').doc(conversationId).get(),
  ]);

  if (groupSnap.exists) {
    const group = toGroupDoc(groupSnap.id, groupSnap.data() ?? {});
    return {
      id: group.id,
      type: 'group',
      participants: group.memberIds,
      name: group.name,
      policy: group.notificationPolicy,
    };
  }

  if (directSnap.exists) {
    const data = directSnap.data();
    return {
      id: directSnap.id,
      type: 'direct',
      participants: asStringArray(isRecord(data) ? data.participantIds : []),
      name: null,
      policy: null,
    };
  }
  return null;
}

export async function loadMessage(
  conversationId: string,
  messageId: string,
): Promise<StoredMessage | null> {
  const snapshot = await realtimeDb.ref(`messages/${conversationId}/${messageId}`).get();
  if (!snapshot.exists()) return null;
  const raw: unknown = snapshot.val();
  return parseStoredMessage(raw);
}


export async function syncConversationMembers(
  conversationId: string,
  memberIds: readonly string[],
): Promise<void> {
  const mirror: Record<string, true> = {};
  for (const id of memberIds) mirror[id] = true;
  await realtimeDb.ref(`conversationMembers/${conversationId}`).set(mirror);
}
