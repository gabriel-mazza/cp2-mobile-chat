export type ConversationType = 'direct' | 'group';

export type NotificationPolicy =
  | 'all_group_messages'
  | 'mentioned_members'
  | 'direct_messages_only'
  | 'disabled';

export const NOTIFICATION_POLICIES: readonly NotificationPolicy[] = [
  'all_group_messages',
  'mentioned_members',
  'direct_messages_only',
  'disabled',
];

export type MessageTarget =
  | { type: 'conversation' }
  | { type: 'member'; memberId: string };

export type StoredMessage = {
  conversationId: string;
  conversationType: ConversationType;
  senderId: string;
  text: string;
  target: MessageTarget;
  mentionedUserIds: string[];
  createdAt: number;
};

export type PushProvider = 'fcm' | 'expo';

export type DeviceTarget = {
  uid: string;
  deviceId: string;
  token: string;
  provider: PushProvider;
};

export type ConversationInfo = {
  id: string;
  type: ConversationType;
  participants: string[];
  name: string | null;
  policy: NotificationPolicy | null;
};

export type GroupDoc = {
  id: string;
  name: string;
  photoUrl: string;
  ownerId: string;
  memberIds: string[];
  memberLimit: number;
  notificationPolicy: NotificationPolicy;
  createdAt: number;
  updatedAt: number;
};
