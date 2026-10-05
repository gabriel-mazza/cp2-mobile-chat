import { useEffect, useMemo, useState } from 'react';
import { observeDirectConversation } from '../services/chatService';
import { observeGroup } from '../services/groupService';
import { ConversationType, DirectConversation } from '../types/chat';
import { ChatGroup } from '../types/group';
import { PublicUser } from '../types/user';
import { getOtherParticipant } from '../utils/conversationId';
import { getErrorMessage } from '../utils/errors';
import { useUserDirectory } from './useUsers';

export type ConversationInfo = {
  title: string;
  photoUrl: string;
  isGroup: boolean;
  isMember: boolean;
  ownerId: string | null;
  otherUserId: string | null;
  members: PublicUser[];
  group: ChatGroup | null;
};

export function useConversationInfo(conversationId: string, type: ConversationType, uid: string | null) {
  const [group, setGroup] = useState<ChatGroup | null>(null);
  const [direct, setDirect] = useState<DirectConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { byId } = useUserDirectory();

  useEffect(() => {
    setLoading(true);
    setError(null);
    setGroup(null);
    setDirect(null);
    const onError = (e: unknown) => {
      setError(getErrorMessage(e));
      setLoading(false);
    };
    if (type === 'group') {
      return observeGroup(
        conversationId,
        (value) => {
          setGroup(value);
          setLoading(false);
        },
        onError,
      );
    }
    return observeDirectConversation(
      conversationId,
      (value) => {
        setDirect(value);
        setLoading(false);
      },
      onError,
    );
  }, [conversationId, type]);

  const info = useMemo<ConversationInfo>(() => {
    if (type === 'group') {
      const memberIds = group?.memberIds ?? [];
      return {
        title: group?.name ?? 'Grupo',
        photoUrl: group?.photoUrl ?? '',
        isGroup: true,
        isMember: uid !== null && memberIds.includes(uid),
        ownerId: group?.ownerId ?? null,
        otherUserId: null,
        members: memberIds.map((id) => byId[id]).filter((u): u is PublicUser => u !== undefined),
        group,
      };
    }
    const otherId = uid && direct ? getOtherParticipant(direct.participants, uid) : null;
    const other = otherId ? byId[otherId] : undefined;
    return {
      title: other?.name ?? 'Conversa',
      photoUrl: other?.photoUrl ?? '',
      isGroup: false,
      isMember: uid !== null && direct !== null && direct.participants.includes(uid),
      ownerId: null,
      otherUserId: otherId,
      members: other ? [other] : [],
      group: null,
    };
  }, [type, group, direct, uid, byId]);

  return { info, loading, error };
}
