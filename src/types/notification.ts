import { ConversationType } from './chat';

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

export const NOTIFICATION_POLICY_LABELS: Record<NotificationPolicy, { title: string; description: string }> = {
  all_group_messages: {
    title: 'Todas as mensagens do grupo',
    description: 'Todos os integrantes (exceto quem enviou) recebem push.',
  },
  mentioned_members: {
    title: 'Somente mencionados',
    description: 'Só quem for mencionado ou selecionado como destinatário recebe push.',
  },
  direct_messages_only: {
    title: 'Somente conversas individuais',
    description: 'Mensagens deste grupo não geram push.',
  },
  disabled: {
    title: 'Desativadas',
    description: 'Nenhuma mensagem deste grupo gera push.',
  },
};

export type NotificationSettings = {
  conversationId: string;
  policy: NotificationPolicy;
  updatedBy: string;
  updatedAt: number;
};

export type PushProvider = 'fcm' | 'expo';

export type DeviceRecord = {
  token: string;
  provider: PushProvider;
  platform: 'ios' | 'android';
  enabled: boolean;
  updatedAt: number;
};

export type PushRegistrationStatus =
  | 'idle'
  | 'registering'
  | 'registered'
  | 'denied'
  | 'unavailable'
  | 'error';

export type NotificationTarget = {
  conversationId: string;
  conversationType: ConversationType;
};
