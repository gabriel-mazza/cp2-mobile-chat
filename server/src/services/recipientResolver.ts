import { ConversationType, MessageTarget, NotificationPolicy } from '../types';

export type ResolveInput = {
  conversationType: ConversationType;
 
  participants: readonly string[];

  policy: NotificationPolicy | null;
  senderId: string;
  target: MessageTarget;
  mentionedUserIds: readonly string[];
};


export function resolveRecipients(input: ResolveInput): string[] {
  const { conversationType, participants, policy, senderId, target, mentionedUserIds } = input;
  const members = new Set(participants);
  members.delete(senderId);

  if (conversationType === 'direct') {
    return Array.from(members);
  }

  switch (policy) {
    case 'all_group_messages':
      
      return Array.from(members);

    case 'mentioned_members': {
      const wanted = new Set<string>(mentionedUserIds);
      if (target.type === 'member') wanted.add(target.memberId);
      return Array.from(wanted).filter((id) => members.has(id));
    }

    case 'direct_messages_only':
    case 'disabled':
    case null:
    default:
      return [];
  }
}
