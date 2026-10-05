import { useEffect, useMemo, useState } from 'react';
import { observeDirectConversations } from '../services/chatService';
import { observeGroups } from '../services/groupService';
import { ConversationSummary, DirectConversation } from '../types/chat';
import { ChatGroup } from '../types/group';
import { getErrorMessage } from '../utils/errors';
import { getOtherParticipant } from '../utils/conversationId';
import { useUserDirectory } from './useUsers';

export function useConversations(uid: string | null) {
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [directs, setDirects] = useState<DirectConversation[]>([]);
  const [groupsReady, setGroupsReady] = useState(false);
  const [directsReady, setDirectsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { byId, loading: directoryLoading } = useUserDirectory();

  useEffect(() => {
    if (!uid) return undefined;
    const onError = (e: unknown) => setError(getErrorMessage(e));
    const stopGroups = observeGroups(
      uid,
      (list) => {
        setGroups(list);
        setGroupsReady(true);
      },
      onError,
    );
    const stopDirects = observeDirectConversations(
      uid,
      (list) => {
        setDirects(list);
        setDirectsReady(true);
      },
      onError,
    );
    return () => {
      stopGroups();
      stopDirects();
    };
  }, [uid]);

  const conversations = useMemo<ConversationSummary[]>(() => {
    const groupItems = groups.map<ConversationSummary>((g) => ({
      id: g.id,
      type: 'group',
      title: g.name,
      subtitle: `Grupo · ${g.memberIds.length}/${g.memberLimit} integrantes`,
      photoUrl: g.photoUrl,
      createdAt: g.updatedAt || g.createdAt,
    }));
    const directItems = directs.map<ConversationSummary>((d) => {
      const otherId = uid ? getOtherParticipant(d.participants, uid) : null;
      const other = otherId ? byId[otherId] : undefined;
      return {
        id: d.id,
        type: 'direct',
        title: other?.name ?? 'Usuário',
        subtitle: 'Conversa individual',
        photoUrl: other?.photoUrl ?? '',
        createdAt: d.createdAt,
      };
    });
    return [...groupItems, ...directItems].sort((a, b) => b.createdAt - a.createdAt);
  }, [groups, directs, byId, uid]);

  return { conversations, loading: !(groupsReady && directsReady) || directoryLoading, error };
}
