import {
  ConversationType,
  MessageTarget,
  NOTIFICATION_POLICIES,
  NotificationPolicy,
  StoredMessage,
} from '../types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

export const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

export function asStringArray(value: unknown): string[] {
  const list: unknown[] = Array.isArray(value)
    ? value
    : isRecord(value)
      ? Object.values(value)
      : [];
  return list.filter((item): item is string => typeof item === 'string');
}

export function isNotificationPolicy(value: unknown): value is NotificationPolicy {
  return typeof value === 'string' && (NOTIFICATION_POLICIES as readonly string[]).includes(value);
}

export function isConversationType(value: unknown): value is ConversationType {
  return value === 'direct' || value === 'group';
}

export function parseTarget(raw: unknown): MessageTarget {
  if (isRecord(raw) && raw.type === 'member' && typeof raw.memberId === 'string') {
    return { type: 'member', memberId: raw.memberId };
  }
  return { type: 'conversation' };
}

export function parseStoredMessage(raw: unknown): StoredMessage | null {
  if (!isRecord(raw)) return null;
  if (!isConversationType(raw.conversationType)) return null;
  const senderId = asString(raw.senderId);
  if (!senderId) return null;
  return {
    conversationId: asString(raw.conversationId),
    conversationType: raw.conversationType,
    senderId,
    text: asString(raw.text),
    target: parseTarget(raw.target),
    mentionedUserIds: asStringArray(raw.mentionedUserIds),
    createdAt: asNumber(raw.createdAt),
  };
}
