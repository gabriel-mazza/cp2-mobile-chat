import {
  Unsubscribe,
  limitToLast,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  serverTimestamp,
  set,
} from 'firebase/database';
import { collection, doc, onSnapshot, query as fsQuery, where } from 'firebase/firestore';
import { apiRequest } from './apiClient';
import { db, realtimeDb } from './firebase';
import { ChatMessage, DirectConversation, SendMessageInput } from '../types/chat';
import { AppError } from '../utils/errors';
import { isRecord, toDirectConversation, toMessage } from '../utils/parsers';

const MESSAGES_LIMIT = 200;

type DirectConversationResponse = { conversationId: string };

/** Cria (ou localiza) a conversa individual. O id é determinístico: uidA_uidB ordenados. */
export async function getOrCreateDirectConversation(myUid: string, otherUid: string): Promise<string> {
  if (myUid === otherUid) {
    throw new AppError('SELF_CONVERSATION', 'Você não pode conversar consigo mesmo.');
  }
  const response = await apiRequest<DirectConversationResponse>('/conversations/direct', {
    method: 'POST',
    body: { otherUserId: otherUid },
  });
  return response.conversationId;
}

export function observeDirectConversations(
  uid: string,
  onData: (conversations: DirectConversation[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const q = fsQuery(collection(db, 'directConversations'), where('participantIds', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => {
      const list: DirectConversation[] = [];
      snap.docs.forEach((d) => {
        const parsed = toDirectConversation(d.id, d.data());
        if (parsed) list.push(parsed);
      });
      onData(list);
    },
    onError,
  );
}

export function observeDirectConversation(
  id: string,
  onData: (conversation: DirectConversation | null) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'directConversations', id),
    (snap) => {
      const data: unknown = snap.data();
      onData(snap.exists() && isRecord(data) ? toDirectConversation(snap.id, data) : null);
    },
    onError,
  );
}

/** Persiste a mensagem no Realtime Database e devolve o id gerado. */
export async function sendChatMessage(input: SendMessageInput): Promise<string> {
  const messageRef = push(ref(realtimeDb, `messages/${input.conversationId}`));
  const messageId = messageRef.key;
  if (!messageId) throw new AppError('NO_KEY', 'Não foi possível gerar o id da mensagem.');

  await set(messageRef, {
    conversationId: input.conversationId,
    conversationType: input.conversationType,
    senderId: input.senderId,
    text: input.text,
    target: input.target.type === 'member' ? { type: 'member', memberId: input.target.memberId } : { type: 'conversation' },
    ...(input.mentionedUserIds.length > 0 ? { mentionedUserIds: input.mentionedUserIds } : {}),
    createdAt: serverTimestamp(),
  });
  return messageId;
}

/** Listener em tempo real das mensagens; retorna a função que remove o listener. */
export function observeMessages(
  conversationId: string,
  onData: (messages: ChatMessage[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const q = query(
    ref(realtimeDb, `messages/${conversationId}`),
    orderByChild('createdAt'),
    limitToLast(MESSAGES_LIMIT),
  );
  return onValue(
    q,
    (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((child) => {
        const raw: unknown = child.val();
        const parsed = child.key ? toMessage(child.key, conversationId, raw) : null;
        if (parsed) list.push(parsed);
      });
      onData(list);
    },
    (error) => onError(error),
  );
}

/** Estado de conectividade com o Realtime Database. */
export function observeConnection(onChange: (connected: boolean) => void): Unsubscribe {
  return onValue(ref(realtimeDb, '.info/connected'), (snapshot) => {
    onChange(snapshot.val() === true);
  });
}
