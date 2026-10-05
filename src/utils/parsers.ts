import { NOTIFICATION_POLICIES, NotificationPolicy } from '../types/notification';
import { ChatMessage, ConversationType, DirectConversation, MessageTarget } from '../types/chat';
import { ChatGroup } from '../types/group';
import { ChatUser, PublicUser } from '../types/user';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

export const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export function asStringArray(value: unknown): string[] {
  const list: unknown[] = Array.isArray(value) ? value : isRecord(value) ? Object.values(value) : [];
  return list.filter((item): item is string => typeof item === 'string');
}

export function isNotificationPolicy(value: unknown): value is NotificationPolicy {
  return typeof value === 'string' && (NOTIFICATION_POLICIES as readonly string[]).includes(value);
}

export function isConversationType(value: unknown): value is ConversationType {
  return value === 'direct' || value === 'group';
}

export function toChatUser(uid: string, data: Record<string, unknown>): ChatUser {
  return {
    uid,
    name: asString(data.name),
    email: asString(data.email),
    phoneNumber: asString(data.phoneNumber),
    birthDate: asString(data.birthDate),
    photoUrl: asString(data.photoUrl),
    createdAt: asNumber(data.createdAt),
  };
}

export function toPublicUser(uid: string, data: Record<string, unknown>): PublicUser {
  const name = asString(data.name);
  return {
    uid,
    name,
    nameLower: asString(data.nameLower, name.toLowerCase()),
    photoUrl: asString(data.photoUrl),
    createdAt: asNumber(data.createdAt),
  };
}

export function toGroup(id: string, data: Record<string, unknown>): ChatGroup {
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

export function toDirectConversation(id: string, data: Record<string, unknown>): DirectConversation | null {
  const ids = asStringArray(data.participantIds);
  const [first, second] = ids;
  if (ids.length !== 2 || !first || !second) return null;
  return { id, type: 'direct', participants: [first, second], createdAt: asNumber(data.createdAt) };
}

function toTarget(raw: unknown): MessageTarget {
  if (isRecord(raw) && raw.type === 'member' && typeof raw.memberId === 'string') {
    return { type: 'member', memberId: raw.memberId };
  }
  return { type: 'conversation' };
}

export function toMessage(id: string, conversationId: string, raw: unknown): ChatMessage | null {
  if (!isRecord(raw)) return null;
  const senderId = asString(raw.senderId);
  const text = asString(raw.text);
  if (!senderId || !text) return null;
  return {
    id,
    conversationId,
    conversationType: isConversationType(raw.conversationType) ? raw.conversationType : 'direct',
    senderId,
    text,
    target: toTarget(raw.target),
    mentionedUserIds: asStringArray(raw.mentionedUserIds),
    createdAt: asNumber(raw.createdAt, Date.now()),
  };
}
